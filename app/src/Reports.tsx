
import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  Download,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Package,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_PUBLIC_URL}/api`;

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

const getLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isCompleted = (order: Order) =>
  order.orderStatus === "Completed" &&
  order.paymentStatus === "Paid";

// ==========================================
// STAT CARD
// ==========================================

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ElementType;
  description?: string;
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
}: StatCardProps) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <div className="rounded-lg bg-teal-50 p-2.5 text-teal-600">
        <Icon size={20} />
      </div>
    </div>

    <h2 className="mt-4 text-2xl font-bold text-slate-900">
      {value}
    </h2>

    {description && (
      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    )}
  </div>
);

// ==========================================
// REPORTS
// ==========================================

const Reports = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getLocalDate(new Date());

  const firstDay = getLocalDate(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
  );

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/orders`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to fetch orders.");
      }

      const data = await response.json();

      setOrders(
        Array.isArray(data) ? data : data.orders || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // FILTER ORDERS
  // ==========================================

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isCompleted(order)) return false;

      const orderDate = getLocalDate(
        new Date(order.createdAt)
      );

      return (
        orderDate >= startDate &&
        orderDate <= endDate
      );
    });
  }, [orders, startDate, endDate]);

  // ==========================================
  // SALES SUMMARY
  // ==========================================

  const grossSales = filteredOrders.reduce(
    (sum, order) => sum + order.subtotal,
    0
  );

  const totalDiscount = filteredOrders.reduce(
    (sum, order) => sum + (order.discount || 0),
    0
  );

  const netSales = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalOrders = filteredOrders.length;

  const averageOrderValue =
    totalOrders > 0 ? netSales / totalOrders : 0;

  // ==========================================
  // PAYMENT BREAKDOWN
  // ==========================================

  const paymentBreakdown = useMemo(() => {
    const totals: Record<string, number> = {
      Cash: 0,
      GCash: 0,
      Card: 0,
    };

    filteredOrders.forEach((order) => {
      totals[order.paymentMethod] =
        (totals[order.paymentMethod] || 0) +
        order.total;
    });

    return totals;
  }, [filteredOrders]);

  const paymentIcons: Record<string, ElementType> = {
    Cash: Banknote,
    GCash: Smartphone,
    Card: CreditCard,
  };

  // ==========================================
  // BEST SELLING PRODUCTS
  // ==========================================

  const bestSellingProducts = useMemo(() => {
    const products: Record<
      string,
      { quantity: number; sales: number }
    > = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!products[item.name]) {
          products[item.name] = {
            quantity: 0,
            sales: 0,
          };
        }

        products[item.name].quantity += item.quantity;

        products[item.name].sales +=
          item.subtotal ||
          item.unitPrice * item.quantity;
      });
    });

    return Object.entries(products)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  // ==========================================
  // EXPORT CSV
  // ==========================================

  const exportCSV = () => {
    const headers = [
      "Order Number",
      "Date",
      "Payment Method",
      "Subtotal",
      "Discount",
      "Total",
      "Status",
    ];

    const rows = filteredOrders.map((order) => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString("en-PH"),
      order.paymentMethod,
      order.subtotal,
      order.discount,
      order.total,
      order.orderStatus,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-report-${startDate}-to-${endDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw
          className="animate-spin text-teal-600"
          size={28}
        />
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="w-full min-w-0 space-y-6 p-4 md:p-6">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sales Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your store's sales and transaction performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* DATE FILTER */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays
            size={19}
            className="text-teal-600"
          />

          <h2 className="font-semibold text-slate-900">
            Report Period
          </h2>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-48"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 sm:w-48"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setStartDate(firstDay);
                setEndDate(today);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-teal-500 hover:text-teal-600"
            >
              This Month
            </button>

            <button
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-teal-500 hover:text-teal-600"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Sales Overview
          </h2>

          <span className="text-xs text-slate-400">
            {totalOrders} completed orders
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Gross Sales"
            value={money(grossSales)}
            icon={TrendingUp}
            description="Before discounts"
          />

          <StatCard
            title="Total Discounts"
            value={money(totalDiscount)}
            icon={Wallet}
            description="Total discounts applied"
          />

          <StatCard
            title="Net Sales"
            value={money(netSales)}
            icon={ShoppingBag}
            description="After discounts"
          />

          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={Receipt}
            description="Completed and paid orders"
          />
        </div>
      </div>

      {/* PAYMENT AND PRODUCTS */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* PAYMENT BREAKDOWN */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Payment Breakdown
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sales collected by payment method
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(paymentBreakdown).map(
              ([method, amount]) => {
                const percentage =
                  netSales > 0
                    ? (amount / netSales) * 100
                    : 0;

                const Icon =
                  paymentIcons[method] || Wallet;

                return (
                  <div key={method}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                          <Icon size={18} />
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {method}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {money(amount)}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-right text-xs text-slate-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* BEST SELLING PRODUCTS */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">
              Best-Selling Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products ranked by quantity sold
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="rounded-l-lg px-3 py-3 font-semibold">
                    Product
                  </th>

                  <th className="px-3 py-3 text-center font-semibold">
                    Qty Sold
                  </th>

                  <th className="rounded-r-lg px-3 py-3 text-right font-semibold">
                    Sales
                  </th>
                </tr>
              </thead>

              <tbody>
                {bestSellingProducts.slice(0, 8).map(
                  (product, index) => (
                    <tr
                      key={product.name}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">
                            {index + 1}.
                          </span>

                          <span className="font-medium text-slate-700">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center text-slate-600">
                        {product.quantity}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        {money(product.sales)}
                      </td>
                    </tr>
                  )
                )}

                {bestSellingProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-10 text-center text-sm text-slate-400"
                    >
                      <Package
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      No product sales for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SALES TRANSACTIONS */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Sales Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Completed and paid orders within the selected period
            </p>
          </div>

          <span className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
            {filteredOrders.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <th className="px-5 py-4 font-semibold">
                  Order Number
                </th>

                <th className="px-5 py-4 font-semibold">
                  Date
                </th>

                <th className="px-5 py-4 font-semibold">
                  Payment
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Subtotal
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Discount
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {order.orderNumber}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleString("en-PH")}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {money(order.subtotal)}
                    </td>

                    <td className="px-5 py-4 text-right text-red-500">
                      -{money(order.discount || 0)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-900">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center"
                  >
                    <Receipt
                      size={32}
                      className="mx-auto mb-2 text-slate-300"
                    />

                    <p className="font-medium text-slate-600">
                      No transactions found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try selecting another date range.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}

        <div className="flex flex-wrap justify-end gap-8 border-t border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Average Order Value
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {money(averageOrderValue)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Net Sales
            </p>

            <p className="mt-1 text-lg font-bold text-teal-600">
              {money(netSales)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
