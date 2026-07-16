import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  getUdharCustomersApi,
  getUdharTransactionsApi,
  createUdharEntryApi,
  deleteUdharEntryApi,
} from "../services/udhar.service";
import { fetchShopUsersApi } from "../services/user.service";
import type { UdharCustomerSummary, UdharEntry, UdharFormInput } from "../types/udhar.types";
import type { AuthUser } from "../types/auth.types";

export default function UdharbookPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<UdharCustomerSummary[]>([]);
  const [allShopCustomers, setAllShopCustomers] = useState<UdharCustomerSummary[]>([]);
  const [shopUsers, setShopUsers] = useState<AuthUser[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals / Drawer State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UdharCustomerSummary | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<UdharEntry[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Form State
  const [formInput, setFormInput] = useState<UdharFormInput>({
    customer_name: "",
    customer_phone: "",
    type: "credit",
    amount: 0,
    packets: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all customers summaries
  const fetchCustomers = async (filterUserId?: string) => {
    try {
      setLoading(true);
      const activeFilter = filterUserId !== undefined ? filterUserId : selectedUserFilter;

      // 1. Fetch full shop customers for totals
      if (user?.role === "owner") {
        const allRes = await getUdharCustomersApi();
        if (allRes.success) {
          setAllShopCustomers(allRes.data);
        }
      }

      // 2. Fetch filtered customers for the list
      const filterToUse = activeFilter === "all" ? undefined : activeFilter;
      const res = await getUdharCustomersApi(filterToUse);
      if (res.success) {
        setCustomers(res.data);
        // If not owner, set allShopCustomers equal to customers so totals are computed normally
        if (user?.role !== "owner") {
          setAllShopCustomers(res.data);
        }
      } else {
        toast.error("Failed to load customer list");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(selectedUserFilter);
  }, [selectedUserFilter]);

  // Fetch shop workers for selection if owner
  useEffect(() => {
    if (user?.role === "owner") {
      (async () => {
        try {
          const list = await fetchShopUsersApi();
          setShopUsers(list);
        } catch (e) {
          console.error("Failed to fetch shop users", e);
        }
      })();
    }
  }, [user]);

  // Fetch transactions for selected customer
  const fetchCustomerTransactions = async (name: string) => {
    try {
      setLoadingTransactions(true);
      const filterToUse = selectedUserFilter === "all" ? undefined : selectedUserFilter;
      const res = await getUdharTransactionsApi(name, filterToUse);
      if (res.success) {
        setCustomerTransactions(res.data);
      } else {
        toast.error("Failed to load ledger history");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error loading ledger details");
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerTransactions(selectedCustomer.customer_name);
    } else {
      setCustomerTransactions([]);
    }
  }, [selectedCustomer, selectedUserFilter]);

  // Handle opening Ledger Drawer
  const handleViewLedger = (customer: UdharCustomerSummary) => {
    setSelectedCustomer(customer);
  };

  // Form Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormInput((prev) => ({
      ...prev,
      [name]: name === "amount" || name === "packets" ? Number(value) : value,
    }));
  };

  const handleOpenAddEntry = (presetName?: string, presetPhone?: string) => {
    setFormInput({
      customer_name: presetName || "",
      customer_phone: presetPhone || "",
      type: "credit",
      amount: 0,
      packets: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEntryModalOpen(true);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInput.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (formInput.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createUdharEntryApi({
        customer_name: formInput.customer_name.trim(),
        customer_phone: formInput.customer_phone?.trim() || undefined,
        type: formInput.type,
        amount: Number(formInput.amount),
        packets: Number(formInput.packets),
        description: formInput.description?.trim() || undefined,
        date: formInput.date || undefined,
      });

      if (res.success) {
        toast.success(
          formInput.type === "credit"
            ? "Udhar entry added successfully!"
            : "Payment recorded successfully!"
        );
        setIsEntryModalOpen(false);
        fetchCustomers(selectedUserFilter);
        if (selectedCustomer && selectedCustomer.customer_name.toLowerCase() === formInput.customer_name.trim().toLowerCase()) {
          fetchCustomerTransactions(selectedCustomer.customer_name);
        }
      } else {
        toast.error(res.message || "Failed to create entry");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error submitting entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry? This will recompute the customer balance.")) {
      return;
    }

    try {
      const res = await deleteUdharEntryApi(id);
      if (res.success) {
        toast.success("Entry deleted successfully");
        fetchCustomers(selectedUserFilter);
        if (selectedCustomer) {
          fetchCustomerTransactions(selectedCustomer.customer_name);
        }
      } else {
        toast.error(res.message || "Failed to delete entry");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error deleting entry");
    }
  };

  // Calculations
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer_phone && c.customer_phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  const totalOutstanding = useMemo(() => {
    return allShopCustomers.reduce((acc, c) => acc + c.net_balance, 0);
  }, [allShopCustomers]);

  const debtorCount = useMemo(() => {
    return allShopCustomers.filter((c) => c.net_balance > 0).length;
  }, [allShopCustomers]);

  // Date Formatting helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📖</span> Udharbook (Credit Ledger)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {user?.role === "owner"
              ? "Monitor and manage credit and payments for all customers in your shop."
              : "Record and manage credits and payments that you have processed."}
          </p>
        </div>
        <button
          onClick={() => handleOpenAddEntry()}
          className="bg-[#1D9E75] hover:bg-[#168a65] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Udhar/Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Total Outstanding Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-slate-100/40 pointer-events-none translate-x-4 translate-y-4">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Outstanding (Pending Udhar)
          </p>
          <h3 className={`text-4xl font-black tracking-tight ${totalOutstanding > 0 ? "text-red-500" : "text-slate-800"}`}>
            ₹ {totalOutstanding.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Net balance sum across all active ledgers
          </p>
        </div>

        {/* Debtor count card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-slate-100/40 pointer-events-none translate-x-4 translate-y-4">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Active Accounts
          </p>
          <h3 className="text-4xl font-black text-slate-800 tracking-tight">
            {debtorCount} {debtorCount === 1 ? "Customer" : "Customers"}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Total people currently holding an outstanding credit balance
          </p>
        </div>
      </div>

      {/* Main Customers List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-colors"
              />
            </div>

            {user?.role === "owner" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">Ledger:</span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-colors cursor-pointer"
                >
                  <option value="all">Entire Shop (All Workers)</option>
                  <option value={user._id}>My Ledger (Owner)</option>
                  {shopUsers
                    .filter((u) => u._id !== user._id)
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <div className="text-xs font-bold text-slate-500">
            Showing {filteredCustomers.length} of {customers.length} records
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#1D9E75]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-semibold text-sm">Loading ledger books...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <p className="text-2xl mb-2">🤷‍♂️</p>
            <h4 className="font-bold text-slate-800 text-sm">No Credit Books Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchTerm
                ? "No matches found. Try refining your search query."
                : "No customer credits have been recorded yet. Click 'New Udhar/Payment' to start."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => {
              const initial = customer.customer_name.charAt(0).toUpperCase();
              const isDebtor = customer.net_balance > 0;
              const isCreditor = customer.net_balance < 0;

              return (
                <div
                  key={`${customer.customer_name}-${customer.customer_phone || ""}`}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Customer avatar */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base uppercase shrink-0 ${
                        isDebtor
                          ? "bg-red-500"
                          : isCreditor
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    >
                      {initial}
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug">
                        {customer.customer_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-400 mt-1">
                        {customer.customer_phone ? (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-0.5">
                            📞 {customer.customer_phone}
                          </span>
                        ) : (
                          <span className="text-[10px] italic">No phone details</span>
                        )}
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] font-medium">
                          Last entry: {formatDate(customer.last_transaction_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Outstanding
                      </p>
                      <p
                        className={`text-lg font-black mt-1 ${
                          isDebtor
                            ? "text-red-500"
                            : isCreditor
                            ? "text-emerald-500"
                            : "text-slate-500"
                        }`}
                      >
                        {isDebtor ? "+" : ""}
                        ₹ {customer.net_balance.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewLedger(customer)}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      View Ledger
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ledger Drawer / Details Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-screen flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm uppercase ${
                    selectedCustomer.net_balance > 0
                      ? "bg-red-500"
                      : selectedCustomer.net_balance < 0
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                >
                  {selectedCustomer.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {selectedCustomer.customer_name}
                  </h3>
                  {selectedCustomer.customer_phone && (
                    <p className="text-xs text-slate-500 font-semibold">📞 {selectedCustomer.customer_phone}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Quick Summary Banner inside Drawer */}
            <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Net Outstanding Balance
                </p>
                <p
                  className={`text-2xl font-black mt-1.5 ${
                    selectedCustomer.net_balance > 0
                      ? "text-red-500"
                      : selectedCustomer.net_balance < 0
                      ? "text-emerald-500"
                      : "text-slate-500"
                  }`}
                >
                  ₹ {selectedCustomer.net_balance.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => {
                  handleOpenAddEntry(selectedCustomer.customer_name, selectedCustomer.customer_phone || undefined);
                }}
                className="bg-[#1D9E75] hover:bg-[#168a65] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                + Add Transaction
              </button>
            </div>

            {/* Transaction Ledger Log List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ledger Entries</h4>

              {loadingTransactions ? (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-[#1D9E75]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs">Fetching transaction history...</span>
                </div>
              ) : customerTransactions.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  No credit transactions logged for this client yet.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                  {customerTransactions.map((tx) => {
                    const isCredit = tx.type === "credit";
                    return (
                      <div key={tx._id} className="relative flex items-start gap-4 pl-8 group">
                        {/* Timeline Bullet */}
                        <span
                          className={`absolute left-2.5 top-2.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 shrink-0 ${
                            isCredit
                              ? "ring-red-400 bg-red-500"
                              : "ring-emerald-400 bg-emerald-500"
                          }`}
                        />

                        {/* Transaction Card */}
                        <div className="flex-1 bg-slate-50 group-hover:bg-slate-100/70 border border-slate-100 rounded-2xl p-4 flex justify-between items-start gap-4 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isCredit
                                    ? "bg-red-50 text-red-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {isCredit ? "Udhar Diya (Credit)" : "Paisa Mila (Payment)"}
                              </span>
                              {tx.packets > 0 && (
                                <span className="text-[10px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded">
                                  📦 {tx.packets} Packets
                                </span>
                              )}
                            </div>
                            {tx.description && (
                              <p className="text-sm font-semibold text-slate-800">
                                {tx.description}
                              </p>
                            )}
                            <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span>{formatDate(tx.date)}</span>
                              <span>•</span>
                              <span>By: {tx.recorded_by?.name || "Owner"}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-sm font-black ${
                                isCredit ? "text-red-500" : "text-emerald-500"
                              }`}
                            >
                              {isCredit ? "+" : "-"} ₹{tx.amount.toLocaleString("en-IN")}
                            </span>

                            {/* Delete entry button (available to owners or the creator worker) */}
                            {(user?.role === "owner" || tx.recorded_by?._id === user?._id) && (
                              <button
                                onClick={() => handleDeleteEntry(tx._id)}
                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete this entry"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Log credit / payment entry
              </h3>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitEntry} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormInput((prev) => ({ ...prev, type: "credit" }))}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    formInput.type === "credit"
                      ? "bg-white text-red-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🔴 Udhar Diya (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setFormInput((prev) => ({ ...prev, type: "payment" }))}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    formInput.type === "payment"
                      ? "bg-white text-emerald-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🟢 Paisa Mila (Payment)
                </button>
              </div>

              {/* Customer Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formInput.customer_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
                  required
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number <span className="text-slate-300 font-normal italic">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="customer_phone"
                  value={formInput.customer_phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
                />
              </div>

              {/* Amount and Packets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formInput.amount || ""}
                    onChange={handleInputChange}
                    placeholder="₹ 0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Packets Count <span className="text-slate-300 font-normal italic">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="packets"
                    value={formInput.packets || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors font-semibold"
                  />
                </div>
              </div>

              {/* Description / Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Item Description / Notes
                </label>
                <input
                  type="text"
                  name="description"
                  value={formInput.description}
                  onChange={handleInputChange}
                  placeholder="e.g. 5 Milk packets & bread"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formInput.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#1D9E75] hover:bg-[#168a65] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
