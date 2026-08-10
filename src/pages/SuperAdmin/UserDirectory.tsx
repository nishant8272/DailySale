import React, { useEffect, useState } from "react";
import { fetchUsersApi, updateUserApi, resetUserPasswordApi } from "../../services/superadmin.service";
import { Search, Edit2, ShieldAlert, X, ShieldCheck, KeyRound, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Forms
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "worker",
    is_active: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    password: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        is_active: isActiveFilter === "active" ? true : isActiveFilter === "inactive" ? false : undefined,
        page,
        limit: 10,
      };
      const data = await fetchUsersApi(params);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      console.error("Error loading users", error);
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, isActiveFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Open Edit
  const openEditModal = (userObj: any) => {
    setSelectedUser(userObj);
    setEditForm({
      name: userObj.name,
      phone: userObj.phone,
      email: userObj.email || "",
      role: userObj.role,
      is_active: userObj.is_active,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserApi(selectedUser._id, editForm);
      toast.success("User profile updated successfully!");
      setIsEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user.");
    }
  };

  // Open Password
  const openPasswordModal = (userObj: any) => {
    setSelectedUser(userObj);
    setPasswordForm({ password: "" });
    setIsPasswordOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetUserPasswordApi(selectedUser._id, passwordForm);
      toast.success("User password reset successfully!");
      setIsPasswordOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
          User Management
        </h1>
        <p className="text-sm text-slate-400 font-semibold">
          Audit user registrations, toggle role access control permissions, or force reset passwords.
        </p>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="worker">Workers</option>
            <option value="super_admin">Super Admins</option>
          </select>

          {/* Active Filter */}
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* USER LIST DATATABLE */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-xs">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Shop Name</th>
                  <th className="py-4 px-4 text-center">Role</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User profile */}
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-800 text-base">{u.name}</div>
                      {u.email && <div className="text-xs text-slate-400 font-semibold">{u.email}</div>}
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {u.phone}
                    </td>

                    {/* Shop */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {u.shop_id?.name || (
                        <span className="text-slate-400 italic">Platform Level</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4 text-center">
                      {u.role === "super_admin" ? (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg">
                          Super Admin
                        </span>
                      ) : u.role === "owner" ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg">
                          Owner
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">
                          Staff
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="Modify User Details"
                          className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => openPasswordModal(u)}
                          title="Reset Password"
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                      No matching user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {!loading && pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Showing page {page} of {pages} ({total} users)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Edit User Details</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Access Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="worker">Staff Worker</option>
                  <option value="owner">Shop Owner</option>
                  <option value="super_admin">Platform Super Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-700">Account Status</span>
                  <p className="text-[10px] text-slate-400 font-semibold">Allow user login and operation access</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-5 h-5 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {isPasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Force Reset Password</h3>
              <button onClick={() => setIsPasswordOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-400">
                Set a new password for user <strong>"{selectedUser?.name}"</strong>. The password will be hashed and updated immediately.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter custom password..."
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
