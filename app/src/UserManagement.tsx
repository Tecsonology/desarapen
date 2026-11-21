
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserRound,
  Mail,
  ShieldCheck,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/users";

export type ManagedUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "employee";
  status: "active" | "inactive";
  createdAt?: string;
};

type AccountRole = "admin" | "employee";

type UserManagementProps = {
  accountRole: AccountRole;
  title: string;
  subtitle: string;
};

const UserManagement = ({
  accountRole,
  title,
  subtitle,
}: UserManagementProps) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });


  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users.");
      }

      const allUsers = Array.isArray(data) ? data : data.users || [];

      // Display only the account type assigned to this page.
      setUsers(
        allUsers.filter(
          (user: ManagedUser) => user.role === accountRole
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accountRole]);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
  }, [users, search]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateUser = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          role: accountRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account.");
      }

      setSuccess(
        `${accountRole === "admin" ? "Admin" : "Employee"} account created successfully.`
      );

      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
      });

      setShowModal(false);

      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPassword(false);
    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#f7f8fc] p-4 md:p-7 lg:p-9">

      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-gray-400">
            Management / {title}
          </p>

          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setSuccess("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add {accountRole === "admin" ? "Admin" : "Employee"}
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total {accountRole === "admin" ? "Admins" : "Employees"}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {users.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Active Accounts
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {users.filter((user) => user.status === "active").length}
              </h2>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <ShieldCheck size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* USER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-gray-900">
              Account List
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Manage your {accountRole} accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-64"
              />
            </div>

            <button
              onClick={fetchUsers}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <RefreshCw className="mx-auto mb-3 animate-spin" />
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold uppercase text-blue-600">
                          {user.name.charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Account ID: {user._id.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-700">
                      {user.username}
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <UserRound
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />
                    <p className="font-medium text-gray-600">
                      No accounts found
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try another search or create a new account.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-400">
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Create {accountRole === "admin" ? "Admin" : "Employee"}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Enter the account information below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 p-6">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter username"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-700">
                  Account role
                </p>
                <p className="mt-1 font-semibold capitalize text-blue-900">
                  {accountRole}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
