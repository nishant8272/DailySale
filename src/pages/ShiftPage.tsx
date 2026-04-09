import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchShopUsersApi } from '../services/user.service';
import {
  getTodayShift as getTodayShiftApi,
  startShift as startShiftApi,
  closeShift as closeShiftApi,
} from '../services/shift.service';
import type { AuthUser } from '../types/auth.types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';

export default function ShiftPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [closingStocks, setClosingStocks] = useState<{ [key: string]: number }>({});
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [pendingWorkerId, setPendingWorkerId] = useState<string>(localStorage.getItem("pending_shift_worker_id") || "");
  const [shopUsers, setShopUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [shopUsersError, setShopUsersError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchShiftStatus = async () => {
    try {
      const res = await getTodayShiftApi();
      setActiveShift(res.data.data);
    } catch (err) {
      setActiveShift(null); // No shift started today
    } finally {
      setLoading(false);
    }
  };

  const fetchShopUsers = async () => {
    setLoadingUsers(true);
    setShopUsersError(null);
    try {
      const users = await fetchShopUsersApi();
      setShopUsers(users);

      // Preselect owner/worker from prior handoff if present; else first active user.
      if (!pendingWorkerId) {
        const firstActiveUser = users.find((u) => u.is_active !== false);
        if (firstActiveUser) {
          setPendingWorkerId(firstActiveUser._id);
        }
      }
    } catch {
      setShopUsers([]);
      setShopUsersError("Could not load shop users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchShiftStatus();
    fetchShopUsers();
  }, []);

  const handleStartShift = async () => {
    try {
      toast.loading("Starting shift...");
      const selectedWorkerId = user?.role === 'owner' && pendingWorkerId ? pendingWorkerId : undefined;
      await startShiftApi(selectedWorkerId);
      localStorage.removeItem("pending_shift_worker_id");
      toast.dismiss();
      toast.success("Shift Started Successfully!");
      navigate("/dashboard");
      setPendingWorkerId("");
      fetchShiftStatus();
    } catch (err) {
      toast.dismiss();
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ||
          "Error starting shift. Ensure yesterday's shift is closed.";
          console.log(message)
        toast.error(message);
        return;
      }

      toast.error("Error starting shift. Ensure yesterday's shift is closed.");
    }
  };

  const handleCloseShift = async () => {
    try {
      // Format the data as your Phase 3 backend expects
      const formattedStocks = Object.keys(closingStocks).map(id => ({
        product_id: id,
        closing_stock: closingStocks[id]
      }));

      await closeShiftApi(formattedStocks);
      toast.success("Shift Closed Successfully!");
      fetchShiftStatus();
      setShowCloseModal(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ||
          "Error closing shift. Check your numbers.";
        toast.error(message);
        return;
      }

      toast.error("Error closing shift. Check your numbers.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Shift Data...</div>;

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="bg-blue-50 p-8 rounded-full mb-6">
          <span className="text-5xl">🏪</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Ready to open shop?</h1>
        <p className="text-gray-500 mt-2 mb-8 max-w-sm">
          Starting the shift will pull yesterday's closing stock as today's opening stock.
        </p>

        <div className="w-full max-w-xl mb-2 text-left">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Users in this shop</h2>

          {loadingUsers ? (
            <p className="text-sm text-gray-500">Loading users...</p>
          ) : shopUsersError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{shopUsersError}</p>
              <button
                type="button"
                onClick={fetchShopUsers}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : shopUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No users found for this shop.</p>
          ) : (
            <div className="space-y-2 bg-white border border-gray-200 rounded-xl p-3">
              {shopUsers.map((shopUser) => {
                const inactive = shopUser.is_active === false;
                const selected = pendingWorkerId === shopUser._id;

                return (
                  <label
                    key={shopUser._id}
                    className={`flex items-center cursor-pointer justify-between gap-3 p-3 rounded-lg border ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${inactive ? 'opacity-60' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name="shift_user"
                        disabled={user?.role !== 'owner' || inactive}
                        checked={selected}
                        onChange={() => {
                          setPendingWorkerId(shopUser._id);
                          localStorage.setItem('pending_shift_worker_id', shopUser._id);
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{shopUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{shopUser.phone}</p>
                      </div>
                    </div>
                    <div className="text-xs flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{shopUser.role}</span>
                      <span className={`px-2 py-1 rounded-full ${inactive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {inactive ? 'Inactive' : 'Active'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {user?.role !== 'owner' && (
            <p className="text-xs text-gray-500 mt-2">Only owner can select who will attend the shift.</p>
          )}

          <button
            type="button"
            onClick={handleStartShift}
            disabled={user?.role === 'owner' && !pendingWorkerId}
            className="mt-6 w-full bg-blue-600 cursor-pointer text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            🚀 Start Shift
          </button>
        </div>
      </div>
    );
  }

  // CASE 2: SHIFT IS OPEN
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Current Shift</h1>
          <p className="text-sm text-green-600 font-medium">● Active & Recording Sales</p>
        </div>
        <button 
          onClick={() => setShowCloseModal(true)}
          className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600"
        >
          Close Shift
        </button>
      </div>

      <div className="grid gap-4">
        {activeShift.products.map((p: any) => (
          <div key={p.product_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{p.product_name}</p>
              <p className="text-xs text-gray-500">
                Opening: {p.opening_stock} | Added: {p.total_added}
              </p>
            </div>
            <div className="flex items-center gap-4">
               <button className="text-blue-600 text-sm font-semibold border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">
                 + Add Stock
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Enter Closing Stock</h2>
            <p className="text-sm text-gray-500 mb-6">Count the items left on the shelf right now.</p>
            
            <div className="space-y-4">
              {activeShift.products.map((p: any) => (
                <div key={p.product_id} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{p.product_name}</label>
                  <input 
                    type="number"
                    placeholder="Qty left"
                    className="border rounded-lg px-3 py-2 w-24 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setClosingStocks({...closingStocks, [p.product_id]: Number(e.target.value)})}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 border rounded-xl font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCloseShift}
                className="flex-1 py-3 bg-black text-white rounded-xl font-bold"
              >
                Submit & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}