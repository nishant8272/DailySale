import { useEffect, useState } from 'react';
import axios from 'axios';
// import { useAuthStore } from '../store/authStore';

export default function ShiftPage() {
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [closingStocks, setClosingStocks] = useState<{ [key: string]: number }>({});
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fetchShiftStatus = async () => {
    try {
      const res = await axios.get('/api/shifts/today');
      setActiveShift(res.data.data);
    } catch (err) {
      setActiveShift(null); // No shift started today
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShiftStatus(); }, []);

  const handleStartShift = async () => {
    try {
      await axios.post('/api/shifts/start');
      fetchShiftStatus();
    } catch (err) {
      alert("Error starting shift. Ensure yesterday's shift is closed.");
    }
  };

  const handleCloseShift = async () => {
    try {
      // Format the data as your Phase 3 backend expects
      const formattedStocks = Object.keys(closingStocks).map(id => ({
        product_id: id,
        closing_stock: closingStocks[id]
      }));

      await axios.post('/api/shifts/close', { closing_stocks: formattedStocks });
      alert("Shift Closed Successfully!");
      fetchShiftStatus();
      setShowCloseModal(false);
    } catch (err) {
      alert("Error closing shift. Check your numbers.");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Shift Data...</div>;

  // CASE 1: NO SHIFT STARTED
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
        <button 
          onClick={handleStartShift}
          className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
        >
          🚀 Start Today's Shift
        </button>
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