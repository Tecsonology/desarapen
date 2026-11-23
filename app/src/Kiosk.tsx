import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { getProducts, updateProduct } from "./api/productService";
import { createQueue } from "./api/queueService";
import type { QueueOrder } from "./types/queueTypes";
import type { CartItem, Product, SizeOption } from "./POS";
import QueuingNumber from "./QueingNumber.tsx";

const categories = ["All", "Fruit Soda", "Fruit Milk", "Snack", "Iced Coffee"];

type KioskProps = {
  /** Optional callback if the parent app controls navigation. */
  onExit?: () => void;
  /** Optional identifier for this kiosk terminal. */
  kioskCode?: string | number;
};

export default function Kiosk({ onExit, kioskCode = 1 }: KioskProps) {
  const [started, setStarted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);
  const [queingNumber, setQueingNumber] = useState(0);
  const [openQueueNo, setOpenQueueNo] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const getAvailableStock = (product: Product) => {
    const inCart = cartItems
      .filter((item) => item._id === product._id)
      .reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, product.stock - inCart);
  };

  const addToCart = (product: Product, size: SizeOption) => {
    if (getAvailableStock(product) <= 0) {
      window.alert("This product is out of stock.");
      return;
    }

    setCartItems((current) => {
      const existing = current.find(
        (item) => item._id === product._id && item.selectedSize.id === size.id
      );

      if (existing) {
        return current.map((item) =>
          item._id === product._id && item.selectedSize.id === size.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, selectedSize: size, quantity: 1 }];
    });
    setSelectedProduct(null);
  };

  const changeQuantity = (item: CartItem, amount: number) => {
    if (amount > 0) {
      const product = products.find((product) => product._id === item._id);
      if (!product || getAvailableStock(product) <= 0) {
        window.alert("Maximum available stock reached.");
        return;
      }
    }

    setCartItems((current) =>
      current
        .map((cartItem) =>
          cartItem._id === item._id &&
          cartItem.selectedSize.id === item.selectedSize.id
            ? { ...cartItem, quantity: cartItem.quantity + amount }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  const removeItem = (item: CartItem) => {
    setCartItems((current) =>
      current.filter(
        (cartItem) =>
          !(
            cartItem._id === item._id &&
            cartItem.selectedSize.id === item.selectedSize.id
          )
      )
    );
  };

  const total = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.selectedSize.price * item.quantity,
        0
      ),
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const active = product.status === "active" && product.stock > 0;
      const categoryMatch =
        selectedCategory === "All" || product.category === selectedCategory;
      const searchMatch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);
      return active && categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, search]);

  const checkout = async () => {
    if (!cartItems.length) {
      window.alert("Your cart is empty.");
      return;
    }

    if (processingOrder) return;

    const receiptItems = [...cartItems];

    try {
      setProcessingOrder(true);

      const queueItems: QueueOrder[] = receiptItems.map((item) => ({
        productName: item.name,
        category: item.category,
        quantity: item.quantity,
        size: item.selectedSize.volume,
        price: item.selectedSize.price,
        subtotal: item.selectedSize.price * item.quantity,
      }));

      const data = await createQueue({
        orders: queueItems,
        status: "pending",
        orderSource: "Kiosk",
        kioskCode: Number(kioskCode),
      });

      setQueingNumber(data.queue.queueNumber);

      const updatedProducts = products.map((product) => {
        const purchased = receiptItems
          .filter((item) => item._id === product._id)
          .reduce((sum, item) => sum + item.quantity, 0);
        return purchased
          ? { ...product, stock: Math.max(0, product.stock - purchased) }
          : product;
      });

      for (const updated of updatedProducts) {
        const original = products.find((item) => item._id === updated._id);
        if (original && original.stock !== updated.stock) {
          await updateProduct(updated._id, { stock: updated.stock });
        }
      }

      setProducts(updatedProducts);
      setCartItems([]);
      setOpenQueueNo(true);
    } catch (err) {
      console.error("Kiosk checkout failed:", err);
      window.alert(
        err instanceof Error ? err.message : "Unable to complete this order."
      );
    } finally {
      setProcessingOrder(false);
    }
  };

  const resetKiosk = () => {
    setSelectedProduct(null);
    setCartItems([]);
    setSearch("");
    setSelectedCategory("All");
    setQueingNumber(0);
    setOpenQueueNo(false);
    setStarted(false);
  };

  if (!started) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 p-6 text-white">
        <img
          src="/cover.png"
          alt="Fruity drinks and iced coffee"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Desarapen logo"
              className="w-44 drop-shadow-md sm:w-52"
            />
          </div>

          <h1 className="text-4xl font-black tracking-tight drop-shadow-sm sm:text-6xl">
            Order something
            <span className="block text-teal-400">delicious.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-slate-200">
            Browse the menu, customize your order, and pay at the counter.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-10 inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-teal-500 px-12 text-xl font-extrabold shadow-lg transition hover:bg-teal-400 active:scale-[0.98]"
          >
            Start your order <ChevronRight size={25} />
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="mt-6 block w-full text-sm text-slate-300 underline underline-offset-4 hover:text-white"
            >
              Exit kiosk
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-slate-950 px-4 py-4 text-white shadow-md sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-lg font-black text-slate-950">
            D
          </div>
          <div>
            <p className="font-extrabold tracking-wide">DESARAPEN</p>
            <p className="text-xs text-slate-400">Self-service ordering</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Cancel this order and return to the welcome screen?"
              )
            ) {
              resetKiosk();
            }
          }}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Start over
          </span>
        </button>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:p-7">
        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">OUR MENU</p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                What would you like?
              </h1>
            </div>
            <label className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:max-w-xs">
              <Search size={19} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search menu..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold transition ${
                  selectedCategory === category
                    ? "bg-teal-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-teal-400"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-slate-500">
              Loading menu...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-bold">Could not load the menu</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => void fetchProducts()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const lowestPrice =
                  product.sizes.length > 0
                    ? Math.min(...product.sizes.map((size) => size.price))
                    : product.price;
                return (
                  <button
                    type="button"
                    key={product._id}
                    onClick={() => setSelectedProduct(product)}
                    disabled={getAvailableStock(product) <= 0}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-[10px] font-bold tracking-wide text-teal-700 uppercase">
                        {product.category}
                      </p>
                      <h2 className="mt-1 line-clamp-2 min-h-10 font-extrabold">
                        {product.name}
                      </h2>
                      <p className="mt-2 text-lg font-black text-teal-700">
                        From ₱{lowestPrice.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {getAvailableStock(product)} available
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)]">
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-teal-400" />
                <h2 className="text-xl font-black">Your order</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">{totalItems} item(s)</p>
            </div>
            <button
              type="button"
              onClick={() => setCartItems([])}
              disabled={!cartItems.length}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-30"
            >
              <Trash2 size={15} /> Clear
            </button>
          </div>

          <div className="min-h-40 flex-1 overflow-y-auto px-5">
            {cartItems.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-slate-500">
                <ShoppingCart size={38} className="mb-3 opacity-40" />
                <p className="font-bold text-slate-300">Your order is empty</p>
                <p className="mt-1 text-xs">Choose an item from the menu.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={`${item._id}-${item.selectedSize.id}`}
                  className="border-b border-slate-800 py-4"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      <p className="mt-1 text-xs text-teal-300">
                        {item.selectedSize.name} · {item.selectedSize.volume}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ₱{(item.selectedSize.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      aria-label={`Remove ${item.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="min-w-5 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(item, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-500"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 p-5">
            <div className="mb-2 flex justify-between text-sm text-slate-400">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="mb-5 flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-3xl font-black text-teal-400">
                ₱{total.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void checkout()}
              disabled={!cartItems.length || processingOrder}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 text-base font-black text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
            >
              Get Queue Number <ChevronRight size={20} />
            </button>
          </div>
        </aside>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-wider text-teal-700 uppercase">
                  Customize your order
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X />
              </button>
            </div>
            {selectedProduct.image && (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="mb-5 h-48 w-full rounded-2xl bg-slate-100 object-cover"
              />
            )}
            <p className="mb-3 font-bold">Choose a size</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedProduct.sizes.map((size) => (
                <button
                  type="button"
                  key={size.id}
                  onClick={() => addToCart(selectedProduct, size)}
                  className="flex min-h-20 items-center justify-between rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-teal-500 hover:bg-teal-50"
                >
                  <span>
                    <span className="block font-extrabold">{size.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {size.volume}
                    </span>
                  </span>
                  <span className="text-lg font-black text-teal-700">
                    ₱{size.price.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
            {selectedProduct.sizes.length === 0 && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No size options are configured for this product.
              </p>
            )}
          </div>
        </div>
      )}

      <QueuingNumber
        queingNumber={queingNumber}
        isOpen={openQueueNo}
        onClose={() => {
          setOpenQueueNo(false);
          resetKiosk();
        }}
      />

      {processingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="font-bold">Processing your order...</p>
            <p className="mt-1 text-sm text-slate-500">
              Please wait. Do not close this screen.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}