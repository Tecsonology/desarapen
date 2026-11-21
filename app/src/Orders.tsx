
import React, { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";

import {
  getOrders,
  deleteOrder,
  type Order,
} from "./api/orderService";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data.orders || data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((order) => order._id !== id));
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Unable to delete order.");
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  return (
    <div className="w-full space-y-6 gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500">
            Manage and monitor your customer transactions.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Orders</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            {orders.length}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Completed Orders</p>
          <h2 className="text-2xl font-bold text-emerald-600 mt-1">
            {orders.filter((order) => order.orderStatus === "Completed").length}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Sales</p>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            {formatCurrency(
              orders
                .filter((order) => order.paymentStatus === "Paid")
                .reduce((sum, order) => sum + order.total, 0)
            )}
          </h2>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <p className="text-sm text-slate-500 self-center">
            {filteredOrders.length} order(s) found
          </p>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {order.orderNumber}
                    </td>

                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      item(s)
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {order.paymentMethod}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.orderStatus === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          title="View order"
                          className="p-2 rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-600"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(order._id)}
                          title="Delete order"
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Order Details
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedOrder.orderNumber}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-medium">
                  {formatDate(selectedOrder.createdAt)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left p-3">Product</th>
                      <th className="text-center p-3">Qty</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`}>
                        <td className="p-3">
                          <p className="font-medium text-slate-800">
                            {item.name}
                          </p>
                          {item.size?.name && (
                            <p className="text-xs text-slate-500">
                              {item.size.name} {item.size.volume}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span>{formatCurrency(selectedOrder.discount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                {selectedOrder.paymentMethod === "Cash" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cash Received</span>
                      <span>{formatCurrency(selectedOrder.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Change</span>
                      <span>{formatCurrency(selectedOrder.change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Status</span>
                <span className="font-medium">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div className="p-5 border-t flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
