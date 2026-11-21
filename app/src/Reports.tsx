
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  Wallet,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

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

const Reports = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getLocalDate(new Date());
  const firstDay = getLocalDate(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/orders`);

      if (!response.ok) {
        throw new Error("Unable to fetch orders.");
      }

      const data = await response.json();

      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!isCompleted(order)) return false;

      const orderDate = getLocalDate(new Date(order.createdAt));

      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, startDate, endDate]);

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

  const paymentBreakdown = useMemo(() => {
    const totals: Record<string, number> = {
      Cash: 0,
      GCash: 0,
      Card: 0,
    };

    filteredOrders.forEach((order) => {
      totals[order.paymentMethod] =
        (totals[order.paymentMethod] || 0) + order.total;
    });

    return totals;
  }, [filteredOrders]);

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
          item.subtotal || item.unitPrice * item.quantity;
      });
    });

    return Object.entries(products)
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

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

  const StatCard = ({
    title,
    value,
    icon: Icon,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-3 text-2xl font-bold text-gray-900">
        {value}
      </h2>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your store's sales and transaction performance.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Date Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <CalendarDays size={17} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            End Date
          </label>
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <CalendarDays size={17} className="text-gray-400" />
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2 text-sm outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setStartDate(firstDay);
            setEndDate(today);
          }}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          This Month
        </button>

        <button
          onClick={() => {
            setStartDate(today);
            setEndDate(today);
          }}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Today
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Gross Sales"
          value={money(grossSales)}
          icon={TrendingUp}
        />

        <StatCard
          title="Total Discounts"
          value={money(totalDiscount)}
          icon={Wallet}
        />

        <StatCard
          title="Net Sales"
          value={money(netSales)}
          icon={ShoppingBag}
        />

        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={CalendarDays}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Payment Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Payment Method Breakdown
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Sales collected by payment method
          </p>

          <div className="space-y-5">
            {Object.entries(paymentBreakdown).map(
              ([method, amount]) => {
                const percentage =
                  netSales > 0 ? (amount / netSales) * 100 : 0;

                return (
                  <div key={method}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{method}</span>
                      <span className="text-gray-500">
                        {money(amount)}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-gray-400">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Best-Selling Products
          </h2>
          <p className="mb-5 text-sm text-gray-500">
            Ranked by quantity sold
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Qty Sold</th>
                  <th className="pb-3 text-right">Sales</th>
                </tr>
              </thead>

              <tbody>
                {bestSellingProducts.slice(0, 8).map(
                  (product, index) => (
                    <tr
                      key={product.name}
                      className="border-b last:border-0"
                    >
                      <td className="py-3">
                        <span className="mr-2 text-xs text-gray-400">
                          {index + 1}.
                        </span>
                        <span className="font-medium">
                          {product.name}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {product.quantity}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {money(product.sales)}
                      </td>
                    </tr>
                  )
                )}

                {bestSellingProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-gray-400"
                    >
                      No product sales for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sales Transactions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-gray-900">
              Sales Transactions
            </h2>
            <p className="text-sm text-gray-500">
              Completed and paid orders within the selected period
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            {filteredOrders.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Total</th>
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
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleString("en-PH")}
                    </td>
                    <td className="px-4 py-3">
                      {order.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {money(order.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      -{money(order.discount || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {money(order.total)}
                    </td>
                  </tr>
                ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-400"
                  >
                    No completed transactions found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-8 border-t pt-4">
          <div>
            <p className="text-xs text-gray-500">Average Order Value</p>
            <p className="font-bold text-gray-900">
              {money(averageOrderValue)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Net Sales</p>
            <p className="text-lg font-bold text-green-600">
              {money(netSales)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
