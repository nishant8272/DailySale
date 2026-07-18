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
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Store, Users, Rocket, Lock, Info, X } from 'lucide-react';

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
      setActiveShift(null);
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
        const message = (err.response?.data as { message?: string } | undefined)?.message || "Error starting shift. Ensure previous shift is closed.";
        toast.error(message);
        return;
      }
      toast.error("Error starting shift. Ensure previous shift is closed.");
    }
  };

  const handleCloseShift = async () => {
    try {
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
        const message = (err.response?.data as { message?: string } | undefined)?.message || "Error closing shift. Check your numbers.";
        toast.error(message);
        return;
      }
      toast.error("Error closing shift. Check your numbers.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  // CASE 1: NO OPEN SHIFT
  if (!activeShift || activeShift.is_closed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-slate-50 p-6 flex items-center justify-center" style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        `}</style>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Store size={40} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ready to open?</h1>
            <p className="text-slate-500 text-sm">
              Starting the shift will pull previous closing stock as today's opening stock.
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Select Attendee</h2>
            </div>

            {loadingUsers ? (
              <p className="text-sm text-slate-500 animate-pulse">Loading users...</p>
            ) : shopUsersError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex justify-between items-center">
                <p className="text-sm text-red-700">{shopUsersError}</p>
                <button onClick={fetchShopUsers} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition">Retry</button>
              </div>
            ) : shopUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No users found.</p>
            ) : (
              <div className="space-y-3">
                {shopUsers.map((shopUser) => {
                  const inactive = shopUser.is_active === false;
                  const selected = pendingWorkerId === shopUser._id;

                  return (
                    <label
                      key={shopUser._id}
                      className={`flex items-center cursor-pointer justify-between gap-4 p-4 rounded-2xl border transition-all ${
                        selected ? 'border-violet-500 bg-violet-50/50 shadow-sm shadow-violet-100' : 'border-slate-200 hover:border-violet-300'
                      } ${inactive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-violet-500' : 'border-slate-300'}`}>
                          {selected && <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />}
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          name="shift_user"
                          disabled={user?.role !== 'owner' || inactive}
                          checked={selected}
                          onChange={() => {
                            setPendingWorkerId(shopUser._id);
                            localStorage.setItem('pending_shift_worker_id', shopUser._id);
                          }}
                        />
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${selected ? 'text-violet-900' : 'text-slate-700'}`}>{shopUser.name}</p>
                          <p className="text-xs text-slate-500 truncate">{shopUser.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">{shopUser.role}</span>
                        {inactive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">Inactive</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            
            {user?.role !== 'owner' && (
              <div className="mt-3 flex gap-2 items-start text-amber-600 bg-amber-50 p-3 rounded-xl text-xs">
                <Info size={14} className="mt-0.5 shrink-0" />
                <p>Only the owner can select who will attend the shift.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartShift}
            disabled={user?.role === 'owner' && !pendingWorkerId}
            className="w-full bg-linear-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Rocket size={20} />
            Start Shift
          </button>
        </div>
      </div>
    );
  }

  // CASE 2: SHIFT IS OPEN
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/40 to-slate-50 p-6 pb-20" style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Current Shift</h1>
              <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase mt-1">Active & Recording Sales</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCloseModal(true)}
            className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all flex items-center gap-2"
          >
            <Lock size={18} />
            Close Shift
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {activeShift.products.map((p: any) => (
            <div key={p.product_id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-violet-200 transition-all">
              <p className="font-bold text-slate-800 text-lg mb-1">{p.product_name}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  Opening: <span className="font-bold text-slate-700">{p.opening_stock}</span>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  Added: <span className="font-bold text-slate-700">{p.total_added}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Close Shift Modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Close Shift</h2>
                  <p className="text-sm text-slate-500 mt-1">Count the items left on the shelf right now.</p>
                </div>
                <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {activeShift.products.map((p: any) => (
                  <div key={p.product_id} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-sm font-bold text-slate-700">{p.product_name}</label>
                    <input 
                      type="number"
                      placeholder="Qty left"
                      className="border border-slate-200 rounded-xl px-4 py-2.5 w-28 text-center font-bold text-violet-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all shadow-sm"
                      onChange={(e) => setClosingStocks({...closingStocks, [p.product_id]: Number(e.target.value)})}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCloseShift}
                  className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all"
                >
                  Submit & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}