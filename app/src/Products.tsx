import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  RefreshCw,
  Package,
  Plus,
  X,
  Trash2,
  Save,
  Image as ImageIcon,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  type CreateProduct,
} from "./api/productService";

import type { Product } from "./POS";

type ProductSize = {
  id: string;
  name: string;
  volume: string;
  price: number;
};

type BulkPreviewRow = {
  rowNumber: number;
  data: CreateProduct;
  errors: string[];
};

const initialForm: CreateProduct = {
  name: "",
  category: "Fruit Soda",
  barcode: "",
  price: 0,
  costPrice: 0,
  stock: 0,
  unit: "bottle",
  description: "",
  image: "",
  status: "active",
  sizes: [],
};

// Helper to parse "Small:12oz:45, Large:16oz:65" into ProductSize[]
const parseSizesString = (raw: unknown): ProductSize[] => {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, idx) => {
      const parts = entry.split(":").map((p) => p.trim());
      return {
        id: `SIZE-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: parts[0] || "",
        volume: parts[1] || "",
        price: Number(parts[2] ?? 0),
      };
    });
};

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Single Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateProduct>({
    ...initialForm,
    sizes: [],
  });

  // Bulk Excel Import Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkPreviewRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResult, setBulkResult] = useState<{
    success: number;
    failed: { name: string; reason: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  // ==========================================
  // SINGLE FORM HANDLERS
  // ==========================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "costPrice" || name === "stock"
          ? Number(value)
          : value,
    }));
  };

  const addSize = () => {
    const newSize: ProductSize = {
      id: `SIZE-${Date.now()}`,
      name: "",
      volume: "",
      price: 0,
    };

    setForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, newSize],
    }));
  };

  const updateSize = (
    index: number,
    field: keyof ProductSize,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) =>
        i === index ? { ...size, [field]: value } : size
      ),
    }));
  };

  const removeSize = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      sizes: [],
    });
    setError("");
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.barcode.trim()) {
      setError("Barcode is required.");
      return;
    }

    if (form.price < 0 || form.costPrice < 0 || form.stock < 0) {
      setError("Price, cost price, and stock cannot be negative.");
      return;
    }

    const invalidSize = form.sizes.some(
      (size) => !size.name.trim() || size.price < 0
    );

    if (invalidSize) {
      setError("Please provide a valid name and price for every size.");
      return;
    }

    try {
      setSaving(true);
      await createProduct(form);
      await fetchProduct();
      setShowModal(false);
      resetForm();
      alert("Product registered successfully!");
    } catch (error) {
      console.error("Failed to register product:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to register product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // BULK EXCEL IMPORT HANDLERS
  // ==========================================

  const openBulkModal = () => {
    setBulkRows([]);
    setBulkFileName("");
    setBulkResult(null);
    setBulkProgress({ current: 0, total: 0 });
    setShowBulkModal(true);
  };

  const closeBulkModal = () => {
    if (bulkImporting) return;
    setShowBulkModal(false);
    setBulkRows([]);
    setBulkFileName("");
    setBulkResult(null);
  };

  const downloadExcelTemplate = () => {
    const sampleData = [
      {
        name: "Strawberry Soda",
        barcode: "4800000000011",
        category: "Fruit Soda",
        price: 55,
        costPrice: 25,
        stock: 50,
        unit: "bottle",
        description: "Refreshing strawberry fruit soda",
        image: "",
        status: "active",
        sizes: "Small:12oz:45, Large:16oz:65",
      },
      {
        name: "Caramel Iced Coffee",
        barcode: "4800000000012",
        category: "Iced Coffee",
        price: 75,
        costPrice: 35,
        stock: 30,
        unit: "cup",
        description: "Chilled caramel espresso",
        image: "",
        status: "active",
        sizes: "Regular:16oz:75, Upsize:22oz:95",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "product_bulk_template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: "" }
        );

        const parsed: BulkPreviewRow[] = rawRows.map((row, idx) => {
          const rowErrors: string[] = [];

          const name = String(row.name ?? row.Name ?? "").trim();
          const barcode = String(row.barcode ?? row.Barcode ?? "").trim();
          const category =
            String(row.category ?? row.Category ?? "Fruit Soda").trim() ||
            "Fruit Soda";
          const price = Number(row.price ?? row.Price ?? 0);
          const costPrice = Number(row.costPrice ?? row.CostPrice ?? 0);
          const stock = Number(row.stock ?? row.Stock ?? 0);
          const unit = String(row.unit ?? row.Unit ?? "bottle").trim();
          const description = String(
            row.description ?? row.Description ?? ""
          ).trim();
          const image = String(row.image ?? row.Image ?? "").trim();
          const rawStatus = String(row.status ?? row.Status ?? "active")
            .trim()
            .toLowerCase();
          const status = rawStatus === "inactive" ? "inactive" : "active";
          const sizes = parseSizesString(row.sizes ?? row.Sizes ?? "");

          if (!name) rowErrors.push("Missing product name");
          if (!barcode) rowErrors.push("Missing barcode");
          if (Number.isNaN(price) || price < 0)
            rowErrors.push("Invalid selling price");
          if (Number.isNaN(costPrice) || costPrice < 0)
            rowErrors.push("Invalid cost price");
          if (Number.isNaN(stock) || stock < 0)
            rowErrors.push("Invalid stock");
          if (sizes.some((s) => !s.name || Number.isNaN(s.price) || s.price < 0))
            rowErrors.push("Invalid size format");

          return {
            rowNumber: idx + 2, // +2 accounts for 1-based index + header row
            data: {
              name,
              barcode,
              category,
              price: Number.isNaN(price) ? 0 : price,
              costPrice: Number.isNaN(costPrice) ? 0 : costPrice,
              stock: Number.isNaN(stock) ? 0 : stock,
              unit,
              description,
              image,
              status,
              sizes,
            },
            errors: rowErrors,
          };
        });

        setBulkRows(parsed);
      } catch (err) {
        console.error("Failed to parse Excel file:", err);
        alert("Could not read the Excel file. Please check the file format.");
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const validBulkRows = bulkRows.filter((r) => r.errors.length === 0);
  const invalidBulkRows = bulkRows.filter((r) => r.errors.length > 0);

  const handleBulkImport = async () => {
    if (validBulkRows.length === 0) return;

    setBulkImporting(true);
    setBulkProgress({ current: 0, total: validBulkRows.length });

    let successCount = 0;
    const failedItems: { name: string; reason: string }[] = [];

    for (let i = 0; i < validBulkRows.length; i++) {
      const row = validBulkRows[i];
      try {
        await createProduct(row.data);
        successCount++;
      } catch (err) {
        failedItems.push({
          name: row.data.name || `Row ${row.rowNumber}`,
          reason:
            err instanceof Error ? err.message : "Failed to register product",
        });
      }
      setBulkProgress({ current: i + 1, total: validBulkRows.length });
    }

    setBulkResult({ success: successCount, failed: failedItems });
    setBulkImporting(false);
    await fetchProduct();
  };

  // ==========================================
  // FILTER & FORMATTERS
  // ==========================================

  const filteredProducts = products.filter((item) =>
    [item.name, item.barcode, item.category]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatCurrency = (price: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full min-w-0 space-y-6 p-4 gap-4">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500">
            Manage your product inventory and pricing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchProduct}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openBulkModal}
            className="flex items-center justify-center gap-2 rounded-lg border border-teal-600 bg-teal-50 px-4 py-2.5 font-medium text-teal-700 hover:bg-teal-100"
          >
            <FileSpreadsheet size={18} />
            Bulk Import (Excel)
          </button>

          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Products</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            {products.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Products</p>
          <h2 className="mt-1 text-2xl font-bold text-emerald-600">
            {products.filter((item) => item.status === "active").length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Inactive Products</p>
          <h2 className="mt-1 text-2xl font-bold text-red-500">
            {products.filter((item) => item.status === "inactive").length}
          </h2>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* SEARCH */}
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <p className="self-center text-sm text-slate-500">
            {filteredProducts.length} product(s) found
          </p>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Sizes</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <Package
                      className="mx-auto mb-2 text-slate-300"
                      size={30}
                    />
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-48 items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg bg-slate-100 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.unit || "No unit"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {item.barcode}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {item.category}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(item.price)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          item.stock <= 10 ? "text-red-500" : "text-slate-700"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex min-w-28 flex-wrap gap-1">
                        {item.sizes?.length ? (
                          item.sizes.map((size) => (
                            <span
                              key={size.id}
                              className="whitespace-nowrap rounded-md bg-teal-50 px-2 py-1 text-xs text-teal-700"
                            >
                              {size.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">No sizes</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          BULK EXCEL IMPORT MODAL
      ========================================== */}
      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeBulkModal();
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Bulk Import Products via Excel
                </h2>
                <p className="text-sm text-slate-500">
                  Upload an .xlsx, .xls, or .csv file to register multiple
                  products at once.
                </p>
              </div>

              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkImporting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* TEMPLATE & UPLOAD CONTROLS */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Need the Excel format?
                  </p>
                  <p className="text-xs text-slate-500">
                    Download the template with sample rows and required columns.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>

              {/* FILE DROPZONE */}
              <div
                onClick={() => !bulkImporting && fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-teal-500 hover:bg-teal-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <Upload className="mx-auto mb-2 text-teal-600" size={32} />
                <p className="text-sm font-semibold text-slate-700">
                  {bulkFileName
                    ? `Selected: ${bulkFileName}`
                    : "Click to select your Excel file (.xlsx, .xls, .csv)"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Sizes format: <code>Small:12oz:45, Large:16oz:65</code>
                </p>
              </div>

              {/* IMPORT RESULT BANNER */}
              {bulkResult && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 size={18} />
                    Successfully imported {bulkResult.success} product(s).
                  </div>
                  {bulkResult.failed.length > 0 && (
                    <div className="space-y-1 text-red-600">
                      <p className="font-semibold">
                        Failed ({bulkResult.failed.length}):
                      </p>
                      <ul className="list-inside list-disc text-xs">
                        {bulkResult.failed.map((f, idx) => (
                          <li key={idx}>
                            {f.name}: {f.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* PREVIEW TABLE */}
              {bulkRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">
                      Preview ({bulkRows.length} rows)
                    </h3>
                    <div className="flex gap-3 text-xs font-medium">
                      <span className="text-emerald-600">
                        Valid: {validBulkRows.length}
                      </span>
                      {invalidBulkRows.length > 0 && (
                        <span className="text-red-500">
                          Invalid (will skip): {invalidBulkRows.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 uppercase text-slate-600">
                        <tr>
                          <th className="px-3 py-2.5">Row</th>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Barcode</th>
                          <th className="px-3 py-2.5">Category</th>
                          <th className="px-3 py-2.5">Price</th>
                          <th className="px-3 py-2.5">Stock</th>
                          <th className="px-3 py-2.5">Sizes</th>
                          <th className="px-3 py-2.5">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkRows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={
                              row.errors.length > 0 ? "bg-red-50/60" : ""
                            }
                          >
                            <td className="px-3 py-2 text-slate-500">
                              #{row.rowNumber}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {row.data.name || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {row.data.barcode || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {row.data.category}
                            </td>
                            <td className="px-3 py-2 text-slate-800">
                              {formatCurrency(row.data.price)}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {row.data.stock}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {row.data.sizes.length > 0
                                ? row.data.sizes.map((s) => s.name).join(", ")
                                : "None"}
                            </td>
                            <td className="px-3 py-2">
                              {row.errors.length === 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 size={14} /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <AlertCircle size={14} />
                                  {row.errors.join(", ")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row">
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkImporting}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={bulkImporting || validBulkRows.length === 0}
                className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkImporting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Importing ({bulkProgress.current}/{bulkProgress.total})...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import {validBulkRows.length} Valid Product(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          REGISTER SINGLE PRODUCT MODAL
      ========================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Register New Product
                </h2>
                <p className="text-sm text-slate-500">
                  Enter the product information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            {/* MODAL FORM */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* PRODUCT INFORMATION */}
                <section>
                  <h3 className="mb-4 font-semibold text-slate-800">
                    Product Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Product Name *
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Strawberry Soda"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Barcode *
                      </label>
                      <input
                        name="barcode"
                        value={form.barcode}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 4800000000011"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Fruit Soda">Fruit Soda</option>
                        <option value="Fruit Milk">Fruit Milk</option>
                        <option value="Snack">Snack</option>
                        <option value="Iced Coffee">Iced Coffee</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Unit
                      </label>
                      <input
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        placeholder="e.g. bottle, serving, piece"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* PRICING AND STOCK */}
                <section>
                  <h3 className="mb-4 font-semibold text-slate-800">
                    Pricing and Inventory
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Selling Price (₱) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Cost Price (₱) *
                      </label>
                      <input
                        type="number"
                        name="costPrice"
                        value={form.costPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Initial Stock *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* IMAGE AND DESCRIPTION */}
                <section>
                  <h3 className="mb-4 font-semibold text-slate-800">
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Image URL
                      </label>
                      <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-slate-400" />
                        <input
                          name="image"
                          value={form.image}
                          onChange={handleChange}
                          placeholder="https://example.com/product.png"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      {form.image && (
                        <div className="mt-3">
                          <img
                            src={form.image}
                            alt="Product preview"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                            className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter product description..."
                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Product Status
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 sm:max-w-xs"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* PRODUCT SIZES */}
                <section>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Product Sizes
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add sizes and their corresponding prices.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addSize}
                      className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100"
                    >
                      <Plus size={16} />
                      Add Size
                    </button>
                  </div>

                  {form.sizes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                      <Package
                        size={28}
                        className="mx-auto mb-2 text-slate-300"
                      />
                      <p className="text-sm text-slate-500">No sizes added.</p>
                      <p className="text-xs text-slate-400">
                        This product will use its default selling price.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.sizes.map((size, index) => (
                        <div
                          key={size.id}
                          className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Size Name *
                            </label>
                            <input
                              value={size.name}
                              onChange={(e) =>
                                updateSize(index, "name", e.target.value)
                              }
                              placeholder="e.g. Small"
                              required
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Volume
                            </label>
                            <input
                              value={size.volume}
                              onChange={(e) =>
                                updateSize(index, "volume", e.target.value)
                              }
                              placeholder="e.g. 12oz"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Price (₱) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={size.price}
                              onChange={(e) =>
                                updateSize(
                                  index,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                              required
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSize(index)}
                            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Register Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;