
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  ArrowUpDown,
  X
} from "lucide-react";

import {
  getProducts,
  updateProduct,
  type Product,
} from "./api/productService";

type FilterType = "All" | "In Stock" | "Low Stock" | "Out of Stock";

function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const LOW_STOCK_LIMIT = 10;

  // ==========================================
  // FETCH INVENTORY
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==========================================
  // INVENTORY SUMMARY
  // ==========================================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  // ==========================================
  // FILTER INVENTORY
  // ==========================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.barcode,
        product.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      let matchesFilter = true;

      if (filter === "In Stock") {
        matchesFilter = product.stock > LOW_STOCK_LIMIT;
      } else if (filter === "Low Stock") {
        matchesFilter =
          product.stock > 0 && product.stock <= LOW_STOCK_LIMIT;
      } else if (filter === "Out of Stock") {
        matchesFilter = product.stock === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  // ==========================================
  // OPEN ADJUSTMENT MODAL
  // ==========================================

  const openAdjustment = (
    product: Product,
    type: "add" | "deduct"
  ) => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setQuantity(1);
    setReason("");
  };

  const closeAdjustment = () => {
    if (saving) return;

    setSelectedProduct(null);
    setQuantity(1);
    setReason("");
  };

  // ==========================================
  // UPDATE STOCK
  // ==========================================

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const newStock =
      adjustmentType === "add"
        ? selectedProduct.stock + quantity
        : selectedProduct.stock - quantity;

    if (newStock < 0) {
      alert("Insufficient stock. You cannot deduct more than the available quantity.");
      return;
    }

    try {
      setSaving(true);

      await updateProduct(selectedProduct._id, {
        stock: newStock,
      });

      setProducts((prev) =>
        prev.map((product) =>
          product._id === selectedProduct._id
            ? { ...product, stock: newStock }
            : product
        )
      );

      alert(
        adjustmentType === "add"
          ? "Stock added successfully!"
          : "Stock deducted successfully!"
      );

      closeAdjustment();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update inventory."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (stock <= LOW_STOCK_LIMIT) {
      return {
        label: "Low Stock",
        className: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "In Stock",
      className: "bg-emerald-100 text-emerald-700",
    };
  };

  const filters: FilterType[] = [
    "All",
    "In Stock",
    "Low Stock",
    "Out of Stock",
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full space-y-6 p-4 gap-4">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Monitor stock levels and manage product quantities.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border bg-white hover:bg-slate-50 text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Total Products</p>
            <Package className="text-teal-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            {totalProducts}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Total Stock</p>
            <ArrowUpDown className="text-blue-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            {totalStock}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Low Stock</p>
            <AlertTriangle className="text-amber-500" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-amber-600 mt-2">
            {lowStock}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Out of Stock</p>
            <XCircle className="text-red-500" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mt-2">
            {outOfStock}
          </h2>
        </div>

      </div>

      {/* INVENTORY TABLE */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        {/* SEARCH AND FILTER */}

        <div className="p-4 border-b border-slate-200 space-y-4">

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search product or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === item
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">

            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Barcode</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Available Stock</th>
                <th className="px-5 py-4">Stock Status</th>
                <th className="px-5 py-4 text-center">Adjust Stock</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No inventory found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product.stock);

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50 transition"
                    >

                      {/* PRODUCT */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-48">

                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-100"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package size={20} className="text-slate-400" />
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-slate-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {product.unit || "Unit"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* BARCODE */}

                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {product.barcode}
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4 text-slate-600">
                        {product.category}
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {product.stock}
                          </span>
                          <span className="text-xs text-slate-400">
                            {product.unit}
                          </span>
                        </div>

                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              product.stock === 0
                                ? "bg-red-500"
                                : product.stock <= LOW_STOCK_LIMIT
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(product.stock, 100)}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            onClick={() => openAdjustment(product, "add")}
                            title="Add stock"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium"
                          >
                            <Plus size={15} />
                            Add
                          </button>

                          <button
                            onClick={() => openAdjustment(product, "deduct")}
                            disabled={product.stock === 0}
                            title="Deduct stock"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={15} />
                            Deduct
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        <div className="p-4 border-t text-xs text-slate-400">
          Showing {filteredProducts.length} of {products.length} products
        </div>

      </div>

      {/* ======================================
          STOCK ADJUSTMENT MODAL
      ====================================== */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

            {/* MODAL HEADER */}

            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {adjustmentType === "add"
                    ? "Add Inventory"
                    : "Deduct Inventory"}
                </h2>

                <p className="text-xs text-slate-500">
                  {selectedProduct.name}
                </p>
              </div>

              <button
                onClick={closeAdjustment}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form onSubmit={handleAdjustment}>

              <div className="p-6 space-y-5">

                {/* CURRENT STOCK */}

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">
                    Current Available Stock
                  </p>

                  <h2 className="text-3xl font-bold text-slate-800 mt-1">
                    {selectedProduct.stock}
                    <span className="text-sm font-normal text-slate-400 ml-2">
                      {selectedProduct.unit}
                    </span>
                  </h2>
                </div>

                {/* ADJUSTMENT TYPE */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Adjustment Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() => setAdjustmentType("add")}
                      className={`flex justify-center items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
                        adjustmentType === "add"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <Plus size={17} />
                      Add Stock
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustmentType("deduct")}
                      className={`flex justify-center items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
                        adjustmentType === "deduct"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <Minus size={17} />
                      Deduct Stock
                    </button>

                  </div>
                </div>

                {/* QUANTITY */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* REASON */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason (Optional)
                  </label>

                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select a reason</option>

                    {adjustmentType === "add" ? (
                      <>
                        <option value="New stock delivery">New stock delivery</option>
                        <option value="Returned items">Returned items</option>
                        <option value="Stock correction">Stock correction</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Damaged items">Damaged items</option>
                        <option value="Expired items">Expired items</option>
                        <option value="Lost items">Lost items</option>
                        <option value="Stock correction">Stock correction</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                {/* PREVIEW */}

                <div className="flex justify-between items-center bg-teal-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-teal-700">
                      New Available Stock
                    </p>
                    <p className="text-2xl font-bold text-teal-800">
                      {adjustmentType === "add"
                        ? selectedProduct.stock + (quantity || 0)
                        : selectedProduct.stock - (quantity || 0)}
                    </p>
                  </div>

                  <Package className="text-teal-600" size={28} />
                </div>

                {adjustmentType === "deduct" &&
                  quantity > selectedProduct.stock && (
                    <p className="text-sm text-red-600">
                      The deduction exceeds the available stock.
                    </p>
                  )}

              </div>

              {/* MODAL FOOTER */}

              <div className="px-6 py-4 border-t flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeAdjustment}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !Number.isInteger(quantity) ||
                    quantity <= 0 ||
                    (adjustmentType === "deduct" &&
                      quantity > selectedProduct.stock)
                  }
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                    adjustmentType === "add"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {saving
                    ? "Updating..."
                    : adjustmentType === "add"
                    ? "Confirm Addition"
                    : "Confirm Deduction"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Inventory;
