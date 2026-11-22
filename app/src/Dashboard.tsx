
import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ShoppingCart,
  Package,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Users,
  UserPlus,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from "lucide-react";

import type { LoggedInUser } from "./api/userService";

const API_URL = `${import.meta.env.VITE_PUBLIC_URL}/api`;

type Product = {
  _id: string;
  name: string;
  stock: number;
  status: "active" | "inactive";
};

type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Order = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "Cash" | "GCash" | "Card";
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value || 0);

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const isCompleted = (order: Order) =>
  order.orderStatus === "Completed" &&
  order.paymentStatus === "Paid";

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [user] = useState<LoggedInUser | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const isSuperadmin = user?.role === "superadmin";
  const canManageUsers = isSuperadmin || user?.role === "admin";

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError("");

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
      ]);

      if (!productsRes.ok || !ordersRes.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();

      setProducts(
        Array.isArray(productsData)
          ? productsData
          : productsData.products || []
      );

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const completedOrders = useMemo(
    () => orders.filter(isCompleted),
    [orders]
  );

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();

    return completedOrders.filter(
      (order) =>
        new Date(order.createdAt).toDateString() === today
    );
  }, [completedOrders]);

  const todaySales = todayOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalStock = products.reduce(
    (sum, product) => sum + (product.stock || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      product.status === "active" && product.stock <= 10
  );

  const paymentTotals = completedOrders.reduce(
    (acc, order) => {
      acc[order.paymentMethod] += order.total;
      return acc;
    },
    { Cash: 0, GCash: 0, Card: 0 }
  );

  const totalCollected = Object.values(paymentTotals).reduce(
    (sum, value) => sum + value,
    0
  );

  const weeklySales = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      const sales = completedOrders
        .filter(
          (order) =>
            new Date(order.createdAt).toDateString() ===
            date.toDateString()
        )
        .reduce((sum, order) => sum + order.total, 0);

      return {
        label: date.toLocaleDateString("en-PH", {
          weekday: "short",
        }),
        sales,
      };
    });
  }, [completedOrders]);

  const maxSales = Math.max(
    ...weeklySales.map((day) => day.sales),
    1
  );

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    color,
    iconColor,
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    color: string;
    iconColor: string;
  }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h2>
        </div>

        <div className={`rounded-xl p-3 ${color} ${iconColor}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-blue-600" size={30} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-7 lg:p-9">

      {/* HEADER */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
            <span>Overview</span>
            <span>/</span>
            <span className="text-blue-600">Dashboard</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Welcome back, {user?.name || user?.username || "User"}!
            Here's what's happening with your store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 sm:flex">
            <Clock size={16} />
            {new Date().toLocaleDateString("en-PH", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ROLE INFORMATION */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-3 text-blue-600 shadow-sm">
            <ShieldCheck size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              {user?.name || user?.username}
            </p>
            <p className="text-xs capitalize text-gray-500">
              {user?.role || "User"} account
            </p>
          </div>
        </div>

        {canManageUsers && (
          <div className="flex flex-wrap gap-2">
            {isSuperadmin && (
              <button
                onClick={() => window.location.assign("/users")}
                className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <Users size={16} />
                Manage Users
              </button>
            )}

            <button
              onClick={() => window.location.assign("/employees")}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <UserPlus size={16} />
              Add Employee
            </button>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={money(todaySales)}
          description={`${todayOrders.length} completed orders today`}
          icon={Wallet}
          color="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Orders Today"
          value={todayOrders.length}
          description="Paid and completed transactions"
          icon={ShoppingCart}
          color="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Total Products"
          value={products.length}
          description={`${totalStock.toLocaleString()} units available in inventory`}
          icon={Package}
          color="bg-orange-50"
          iconColor="text-orange-600"
        />

        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          description="Products with 10 or fewer units"
          icon={AlertTriangle}
          color="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* SALES AND PAYMENTS */}
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* SALES CHART */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sales Overview
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Your sales performance over the last 7 days
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={21} />
            </div>
          </div>

          <div className="flex h-64 items-end gap-3 sm:gap-5">
            {weeklySales.map((day, index) => {
              const height =
                day.sales > 0
                  ? Math.max((day.sales / maxSales) * 100, 5)
                  : 0;

              return (
                <div
                  key={`${day.label}-${index}`}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                >
                  <span className="text-center text-[10px] font-medium text-gray-400 sm:text-xs">
                    {day.sales > 0 ? money(day.sales) : "₱0"}
                  </span>

                  <div className="flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        index === 6
                          ? "bg-blue-600"
                          : "bg-blue-100 hover:bg-blue-300"
                      }`}
                      style={{ height: `${height}%` }}
                      title={money(day.sales)}
                    />
                  </div>

                  <span className="text-xs font-semibold text-gray-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAYMENT METHODS */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-7">
            <h2 className="text-lg font-bold text-gray-900">
              Payment Methods
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              All-time completed sales
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(paymentTotals).map(([method, amount]) => {
              const percentage =
                totalCollected > 0
                  ? (amount / totalCollected) * 100
                  : 0;

              return (
                <div key={method}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {method}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {money(amount)}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="mt-1.5 text-right text-xs text-gray-400">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-gray-100 pt-5">
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <CreditCard size={17} />
              Total collected
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {money(totalCollected)}
            </h2>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS AND INVENTORY */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* RECENT TRANSACTIONS */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Transactions
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Latest customer purchases
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-4 font-medium">Order</th>
                  <th className="pb-4 font-medium">Payment</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 text-right font-medium">Total</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-4 font-semibold text-gray-800">
                      {order.orderNumber}
                    </td>

                    <td className="py-4">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="py-4 text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="py-4 text-right font-bold text-gray-900">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}

                {recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-gray-400"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Inventory Alerts
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Products that need restocking
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="space-y-3">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gray-100 p-3 text-gray-500">
                    <Package size={19} />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Product inventory
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    product.stock === 0
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {product.stock === 0
                    ? "Out of stock"
                    : `${product.stock} left`}
                </span>
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <Package size={23} />
                </div>
                <p className="font-medium text-gray-700">
                  All inventory looks good!
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  No low-stock products found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-gray-400">
        <p>POS Management System</p>
        <p>Logged in as {user?.role || "Guest"}</p>
      </div>
    </div>
  );
};

export default Dashboard;
