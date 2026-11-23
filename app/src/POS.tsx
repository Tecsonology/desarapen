
import { useEffect, useState } from "react";
import ReceiptModal from "./ReceiptModal";
import Payment from "./Payment.tsx";
import { getProducts, updateProduct } from "./api/productService";
import { createOrder } from "./api/orderService";
import type { CreateOrder } from "./api/orderService";
import { createQueue } from "./api/queueService";
import type { QueueOrder } from "./types/queueTypes";
import type { LoggedInUser } from "./api/userService";
import type { Queue } from "./types/queueTypes";
import socket from "./socket/socket.ts";
import type { QueueStatus } from "./types/queueTypes";
import { LayoutPanelLeft } from "lucide-react";

import {
    ArrowLeft,
    ShoppingCart,
    X,
    Plus,
    Minus,
    Trash2,
    RefreshCw,
    Package,
    ShoppingBag,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

export type SizeOption = {
    id: string;
    name: string;
    volume: string;
    price: number;
};

const categories = [
    "All",
    "Fruit Soda",
    "Fruit Milk",
    "Snack",
    "Iced Coffee",
];

export type Product = {
    _id: string;
    name: string;
    category:
        | "Fruit Soda"
        | "Fruit Milk"
        | "Snack"
        | "Iced Coffee";
    barcode: string;
    price: number;
    costPrice?: number;
    stock: number;
    unit?: string;
    description: string;
    image: string;
    status: "active" | "inactive";
    sizes: SizeOption[];
};

export type CartItem = Product & {
    selectedSize: SizeOption;
    quantity: number;
};

type PosProp = {
    showNav?: () => void;
};

// ==========================================
// POS COMPONENT
// ==========================================

function POS({ showNav }: PosProp) {

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);

    const [showReceipt, setShowReceipt] = useState(false);
    const [lastReceipt, setLastReceipt] = useState<CartItem[]>([]);
    const [receiptNumber, setReceiptNumber] = useState("");
    const [cashReceived, setCashReceived] = useState(0);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [payment, setPayment] = useState(false);
    const [processingOrder, setProcessingOrder] = useState(false);

    const [ openKiosk, setOpenKiosk ] = useState(false)
    const [queues, setQueues] = useState<Queue[]>([]);
    

    const [user] = useState<LoggedInUser | null>(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const data = await getProducts();

            setProducts(data);
            setError("");
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
        fetchProducts();
    }, []);

    // ==========================================
    // AVAILABLE STOCK
    // ==========================================

    const getAvailableStock = (product: Product) => {
        const cartQuantity = cartItems
            .filter((item) => item._id === product._id)
            .reduce((sum, item) => sum + item.quantity, 0);

        return Math.max(0, product.stock - cartQuantity);
    };

    // ==========================================
    // OPEN SIZE SELECTION
    // ==========================================

    const openSizeSelection = (item: Product) => {
        const availableStock = getAvailableStock(item);

        if (availableStock <= 0) {
            alert("This product is out of stock.");
            return;
        }

        setSelectedProduct(item);
    };

    // ==========================================
    // ADD TO CART
    // ==========================================

    const addToCart = (item: Product, size: SizeOption) => {
        const availableStock = getAvailableStock(item);

        if (availableStock <= 0) {
            alert("Maximum available stock reached.");
            return;
        }

        setCartItems((prev) => {
            const existingItem = prev.find(
                (cartItem) =>
                    cartItem._id === item._id &&
                    cartItem.selectedSize.id === size.id
            );

            if (existingItem) {
                return prev.map((cartItem) =>
                    cartItem._id === item._id &&
                    cartItem.selectedSize.id === size.id
                        ? {
                            ...cartItem,
                            quantity: cartItem.quantity + 1,
                        }
                        : cartItem
                );
            }

            return [
                ...prev,
                {
                    ...item,
                    selectedSize: size,
                    quantity: 1,
                },
            ];
        });

        setSelectedProduct(null);
    };

    // ==========================================
    // INCREASE QUANTITY
    // ==========================================

    const increaseQuantity = (id: string, sizeId: string) => {
        const product = products.find((item) => item._id === id);

        if (!product) return;

        if (getAvailableStock(product) <= 0) {
            alert("Maximum available stock reached.");
            return;
        }

        setCartItems((prev) =>
            prev.map((item) =>
                item._id === id &&
                item.selectedSize.id === sizeId
                    ? {
                        ...item,
                        quantity: item.quantity + 1,
                    }
                    : item
            )
        );
    };

    // ==========================================
    // DECREASE QUANTITY
    // ==========================================

    const decreaseQuantity = (id: string, sizeId: string) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item._id === id &&
                    item.selectedSize.id === sizeId
                        ? {
                            ...item,
                            quantity: item.quantity - 1,
                        }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    // ==========================================
    // REMOVE ITEM
    // ==========================================

    const removeItem = (id: string, sizeId: string) => {
        setCartItems((prev) =>
            prev.filter(
                (item) =>
                    !(
                        item._id === id &&
                        item.selectedSize.id === sizeId
                    )
            )
        );
    };

    // ==========================================
    // CLEAR CART
    // ==========================================

    const clearCart = () => {
        setCartItems([]);
        setCashReceived(0);
    };

    // ==========================================
    // CALCULATIONS
    // ==========================================

    const total = cartItems.reduce(
        (sum, item) =>
            sum + item.selectedSize.price * item.quantity,
        0
    );

    const totalItems = cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    // ==========================================
    // ORDER SUCCESS
    // ==========================================

    const orderSuccess = async (cash: number) => {

        const data: CreateOrder = {
            items: cartItems.map((item) => ({
                productId: item._id,
                quantity: item.quantity,
                size: {
                    id: item.selectedSize.id,
                },
            })),
            discount: 0,
            paymentMethod: "Cash",
            cashReceived: cash,
            notes: "Walk-in customer",
        };

        const response = await createOrder(data);

        console.log("Order successfully created:", response);

        // Update local inventory.
        // Assumes your backend does not already decrement stock.
        const updatedProducts = products.map((product) => {
            const purchasedQuantity = cartItems
                .filter((item) => item._id === product._id)
                .reduce((sum, item) => sum + item.quantity, 0);

            return {
                ...product,
                stock: product.stock - purchasedQuantity,
            };
        });

        for (const product of updatedProducts) {
            const originalProduct = products.find(
                (item) => item._id === product._id
            );

            if (
                originalProduct &&
                originalProduct.stock !== product.stock
            ) {
                await updateProduct(product._id, {
                    stock: product.stock,
                });
            }
        }

        setProducts(updatedProducts);

        return response;
    };

    // ==========================================
    // CHECKOUT
    // ==========================================

    const checkout = async (cash: number) => {

        if (cartItems.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        if (cash < total) {
            alert("Insufficient cash received.");
            return;
        }

        if (processingOrder) return;

        try {
            setProcessingOrder(true);

            const receiptItems = [...cartItems];

            // Create order.
            await orderSuccess(cash);

            // Prepare kitchen queue.
            const queueItems: QueueOrder[] = cartItems.map((item) => ({
                productName: item.name,
                category: item.category,
                quantity: item.quantity,
                size: item.selectedSize.volume,
                price: item.selectedSize.price,
                subtotal:
                    item.selectedSize.price * item.quantity,
            }));

            const sendQueue = await createQueue({
                orders: queueItems,
                status: "pending",
            });

            console.log("Queue created:", sendQueue);

            // Receipt details.
            setLastReceipt(receiptItems);
            setReceiptNumber(`REC-${Date.now()}`);
            setCashReceived(cash);

            // Clear cart.
            setCartItems([]);

            setPayment(false);
            setShowReceipt(true);

        } catch (error) {
            console.error("Checkout failed:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to process order."
            );
        } finally {
            setProcessingOrder(false);
        }
    };

    //CHANGE QUEUE STATUS

      const changeStatus = async (id: string, status: QueueStatus) => {
      try {
        await fetch(`${import.meta.env.VITE_PUBLIC_URL}/api/queue/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        });
      } catch (error) {
        console.error("Failed to update queue:", error);
      }
    };

    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    const filteredProducts = products.filter((item) => {
        const isActive = item.status === "active";

        const matchesCategory =
            selectedCategory === "All" ||
            item.category === selectedCategory;

        return isActive && matchesCategory;
    });


    //==========================================
    // KIOSKSS
    //=======================================

    useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_PUBLIC_URL}/api/queue`, {
          credentials: "include",
        });

        const data = await response.json();

        setQueues(data.queues || []);
      } catch (error) {
        console.error("Failed to fetch queues:", error);
      }
    };

    fetchQueues();

    socket.on("queue:new", (newQueue: Queue) => {
      setQueues((prev) => [
        ...prev.filter((queue) => queue._id !== newQueue._id),
        newQueue,
      ]);
    });

    socket.on("queue:updated", (updatedQueue: Queue) => {
      setQueues((prev) => {
        if (updatedQueue.status === "done") {
          return prev.filter((queue) => queue._id !== updatedQueue._id);
        }

        return prev.map((queue) =>
          queue._id === updatedQueue._id ? updatedQueue : queue
        );
      });
    });

    socket.on("queue:deleted", (deletedId: string) => {
      setQueues((prev) => prev.filter((queue) => queue._id !== deletedId));
    });

    return () => {
      socket.off("queue:new");
      socket.off("queue:updated");
      socket.off("queue:deleted");
    };
  }, []);

  const handleLoadKioskOrder = (kioskQueue: Queue, id : string) => {
    const loadedCart: CartItem[] = [];

    changeStatus(id, "done")

    for (const orderItem of kioskQueue.orders) {
        const matchedProduct = products.find(
            (p) => p.name.toLowerCase() === orderItem.productName.toLowerCase()
        );

        if (!matchedProduct) {
            console.warn(`Product not found in POS list: ${orderItem.productName}`);
            continue;
        }

        const matchedSize: SizeOption =
            matchedProduct.sizes.find(
                (s) =>
                    s.volume.toLowerCase() === String(orderItem.size).toLowerCase() ||
                    s.name.toLowerCase() === String(orderItem.size).toLowerCase()
            ) || {
                id: `custom-${orderItem.size}`,
                name: String(orderItem.size),
                volume: String(orderItem.size),
                price: orderItem.price,
            };

        const safeQty = Math.min(orderItem.quantity, Math.max(0, matchedProduct.stock));
        if (safeQty <= 0) continue;

        const existingIndex = loadedCart.findIndex(
            (c) => c._id === matchedProduct._id && c.selectedSize.id === matchedSize.id
        );

        if (existingIndex > -1) {
            loadedCart[existingIndex].quantity += safeQty;
        } else {
            loadedCart.push({
                ...matchedProduct,
                selectedSize: matchedSize,
                quantity: safeQty,
            });
        }
    }

    
    setCartItems(loadedCart);
    setOpenKiosk(false);
};

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="flex h-dvh w-full flex-col gap-3 overflow-hidden bg-slate-100 p-2 sm:p-4 md:flex-row">
            {
                openKiosk && (
                    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl bg-white p-4 shadow-sm">
  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
    <div className="flex flex-row justify-center items-center gap-2">
        <button
                        onClick={()=> {
                          setOpenKiosk(false)
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ArrowLeft size={18} />
                    </button>
        <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900">
        Kiosk's Orders Queue
      </h1>
      <p className="text-xs text-slate-500">
        Tap a queue number to load the order into the cart
      </p>
        </div>
    </div>

    <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
      {queues.filter((q) => q.orderSource === "Kiosk").length} Waiting
    </span>
  </div>

  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {queues
        .filter((q) => q.orderSource === "Kiosk")
        .map((item) => {
          const itemCount = item.orders.reduce(
            (sum, order) => sum + order.quantity,
            0
          );
          const totalAmount = item.orders.reduce(
            (sum, order) => sum + (order.subtotal ?? order.price * order.quantity),
            0
          );

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => handleLoadKioskOrder(item, item._id)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase group-hover:text-teal-600">
                  Queue No.
                </span>
                {item.kioksCode && (
                  <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    Kiosk #{item.kioksCode}
                  </span>
                )}
              </div>

              <div className="my-2 font-mono text-3xl font-black text-slate-900 group-hover:text-teal-700">
                {String(item.queueNumber).padStart(2, "0")}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs text-slate-600">
                <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                <span className="font-bold text-slate-800">
                  ₱{totalAmount.toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}
    </div>

    {queues.filter((q) => q.orderSource === "Kiosk").length === 0 && (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
        <p className="text-sm font-semibold text-slate-500">
          No active kiosk orders
        </p>
        <p className="mt-1 text-xs">
          New kiosk orders will appear here automatically.
        </p>
      </div>
    )}
  </div>
</div>
                )
            }
            {
                !openKiosk && (
                  

            <div className="menu-container flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:w-2/3">

                {/* HEADER */}

                <div className="mb-3 flex shrink-0 items-center gap-3">
                    <button
                        onClick={()=> {
                          showNav
                          window.history.back()
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                            Products
                        </h2>

                        <p className="text-xs text-slate-500">
                            Select products to add to cart
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-teal-700">
                        <Package size={17} />
                        <span className="text-xs font-semibold">
                            {filteredProducts.length} Products
                        </span>
                    </div>
                </div>

                {/* CATEGORY FILTER */}

                <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                    <div className="w-full flex gap-2">
                        {categories.map((item) => (
                        <button
                            key={item}
                            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                                selectedCategory === item
                                    ? "bg-teal-600 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-600 hover:border-teal-500 hover:text-teal-600"
                            }`}
                            onClick={() => setSelectedCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                    </div>

                    <button className="mx-2 bg-blue-400 text-white cursor-pointer px-2 py-1 flex flex-row justify-center items-center rounded-md gap-2" onClick={()=> {setOpenKiosk(true)}}>
                        <LayoutPanelLeft />
                        <p className="font-bold">Kioks Queue</p>
                    </button>
                </div>

                {/* PRODUCT LIST SCROLL AREA */}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">

                    {/* LOADING */}

                    {loading && (
                        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-400">
                            <RefreshCw
                                size={26}
                                className="animate-spin text-teal-600"
                            />
                            <p className="text-sm">
                                Loading products...
                            </p>
                        </div>
                    )}

                    {/* ERROR */}

                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            {error}

                            <button
                                onClick={fetchProducts}
                                className="ml-2 font-semibold underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* PRODUCTS */}

                    {!loading && !error && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">

                            {filteredProducts.map((item) => {
                                const availableStock =
                                    getAvailableStock(item);

                                return (
                                    <button
                                        key={item._id}
                                        onClick={() =>
                                            openSizeSelection(item)
                                        }
                                        className="min-w-0 text-left"
                                        disabled={availableStock <= 0}
                                    >
                                        <ItemCard
                                            {...item}
                                            stock={availableStock}
                                        />
                                    </button>
                                );
                            })}

                            {filteredProducts.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                                    <ShoppingBag
                                        size={36}
                                        className="mb-3 text-slate-300"
                                    />

                                    <p className="font-semibold text-slate-600">
                                        No products available
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Try selecting another category.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
                )
            }

            {/* ======================================
                CART SECTION
            ====================================== */}

            {!payment && (
                <div className="cart-container flex h-[42dvh] min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl bg-slate-900 p-3 text-white shadow-lg sm:p-4 md:h-full md:w-[350px] lg:w-[380px]">

                    {/* CART HEADER */}

                    <div className="mb-3 flex shrink-0 items-center justify-between border-b border-slate-700 pb-3">

                        <div>
                            <div className="flex items-center gap-2">
                                <ShoppingCart
                                    size={20}
                                    className="text-teal-400"
                                />

                                <h1 className="text-lg font-bold">
                                    Cart
                                </h1>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                                {totalItems} items in your cart
                            </p>
                        </div>

                        <button
                            onClick={clearCart}
                            disabled={cartItems.length === 0}
                            className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-30"
                        >
                            <Trash2 size={14} />
                            Clear all
                        </button>
                    </div>

                    {/* CART ITEMS */}

                    <div className="cart-items min-h-0 flex-1 overflow-y-auto overscroll-contain">

                        {cartItems.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center py-6 text-slate-500">
                                <ShoppingCart
                                    size={36}
                                    className="mb-3 opacity-40"
                                />

                                <p className="text-sm font-medium">
                                    Your cart is empty
                                </p>

                                <p className="mt-1 text-xs">
                                    Select products to get started.
                                </p>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div
                                    key={`${item._id}-${item.selectedSize.id}`}
                                    className="flex items-center gap-2 border-b border-slate-700 py-3"
                                >

                                    {/* PRODUCT DETAILS */}

                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-semibold">
                                            {item.name}
                                        </h3>

                                        <p className="mt-0.5 text-xs text-teal-400">
                                            {item.selectedSize.name} (
                                            {item.selectedSize.volume})
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            ₱{item.selectedSize.price.toFixed(2)}
                                            {" "}x {item.quantity}
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-white">
                                            ₱{(
                                                item.selectedSize.price *
                                                item.quantity
                                            ).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* QUANTITY CONTROLS */}

                                    <div className="flex shrink-0 items-center gap-1">

                                        <button
                                            onClick={() =>
                                                decreaseQuantity(
                                                    item._id,
                                                    item.selectedSize.id
                                                )
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700 text-white transition hover:bg-slate-600"
                                        >
                                            <Minus size={13} />
                                        </button>

                                        <span className="w-6 text-center text-sm font-bold">
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                increaseQuantity(
                                                    item._id,
                                                    item.selectedSize.id
                                                )
                                            }
                                            disabled={
                                                !products.find(
                                                    (product) =>
                                                        product._id === item._id
                                                ) ||
                                                getAvailableStock(
                                                    products.find(
                                                        (product) =>
                                                            product._id === item._id
                                                    )!
                                                ) <= 0
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-white transition hover:bg-teal-500 disabled:opacity-30"
                                        >
                                            <Plus size={13} />
                                        </button>

                                        <button
                                            onClick={() =>
                                                removeItem(
                                                    item._id,
                                                    item.selectedSize.id
                                                )
                                            }
                                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* CART SUMMARY */}

                    <div className="cart-summary mt-3 shrink-0 border-t border-slate-700 pt-3">

                        <div className="mb-2 flex justify-between text-sm text-slate-400">
                            <span>Total Items</span>
                            <span>{totalItems}</span>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-base font-bold">
                                Total
                            </span>

                            <span className="text-2xl font-bold text-teal-400">
                                ₱{total.toFixed(2)}
                            </span>
                        </div>

                        <button
                            onClick={() => setPayment(true)}
                            disabled={cartItems.length === 0}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                            <ShoppingBag size={18} />
                            Checkout
                        </button>
                    </div>
                </div>
            )}

            {/* ======================================
                SIZE SELECTION MODAL
            ====================================== */}

            {selectedProduct && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* MODAL HEADER */}

                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Select Size
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedProduct.name}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* PRODUCT IMAGE */}

                        <div className="mb-5 flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:h-44">
                            {selectedProduct.image ? (
                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-sm text-slate-400">
                                    No Image
                                </span>
                            )}
                        </div>

                        {/* SIZE OPTIONS */}

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {selectedProduct.sizes.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() =>
                                        addToCart(selectedProduct, size)
                                    }
                                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3 transition hover:border-teal-500 hover:bg-teal-50"
                                >
                                    <span className="text-sm font-bold text-slate-800">
                                        {size.name}
                                    </span>

                                    <span className="text-xs text-slate-500">
                                        {size.volume}
                                    </span>

                                    <span className="text-lg font-bold text-teal-600">
                                        ₱{size.price.toFixed(2)}
                                    </span>

                                    <span className="text-xs font-medium text-teal-600">
                                        Select
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* MODAL FOOTER */}

                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="text-center text-xs text-slate-400">
                                Available stock:{" "}
                                {getAvailableStock(selectedProduct)}
                            </p>

                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="mt-3 w-full rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================
                RECEIPT MODAL
            ====================================== */}

            <ReceiptModal
                isOpen={showReceipt}
                onClose={() => {
                    setShowReceipt(false);
                    clearCart();
                }}
                cashier={user ? user._id.slice(-6) : ""}
                items={lastReceipt}
                receiptNumber={receiptNumber}
                cashReceived={cashReceived}
            />

            {/* ======================================
                PAYMENT MODAL
            ====================================== */}

            {payment && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4">
                    <div className="my-auto w-full max-w-md">
                        <Payment
                            totalPrice={total}
                            paymentMethod="Cash"
                            cashReceived={cashReceived}
                            setCashReceived={setCashReceived}
                            onConfirm={(cash: number) => {
                                checkout(cash);
                            }}
                            onCancel={() => {
                                setPayment(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ======================================
                PROCESSING OVERLAY
            ====================================== */}

            {processingOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />

                        <p className="font-semibold text-slate-800">
                            Processing order...
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Please wait while we complete your transaction.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default POS;

// ==========================================
// ITEM CARD COMPONENT
// ==========================================

type ItemCardProps = Product;

const ItemCard = ({
    name,
    category,
    stock,
    image,
    sizes,
}: ItemCardProps) => {

    const lowestPrice =
        sizes.length > 0
            ? Math.min(...sizes.map((size) => size.price))
            : 0;

    return (
        <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-2 transition hover:border-teal-400 hover:shadow-md sm:p-3">

            {/* PRODUCT IMAGE */}

            <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-xs text-slate-400">
                        No Image
                    </span>
                )}
            </div>

            {/* PRODUCT DETAILS */}

            <div>
                <span className="mb-2 inline-block rounded bg-teal-50 px-2 py-1 text-[9px] font-semibold uppercase text-teal-700 sm:text-[10px]">
                    {category}
                </span>

                <h3 className="line-clamp-2 text-xs font-bold leading-tight text-slate-800 sm:text-sm">
                    {name}
                </h3>
            </div>

            {/* PRICE AND STOCK */}

            <div className="mt-3 border-t border-slate-100 pt-2">

                <div className="flex flex-wrap items-center justify-between gap-1">
                    <span
                        className={`text-[10px] font-semibold sm:text-xs ${
                            stock <= 0
                                ? "text-red-500"
                                : stock <= 10
                                ? "text-amber-600"
                                : "text-slate-500"
                        }`}
                    >
                        Stock: {stock}
                    </span>
                </div>

                <p className="mt-1 text-xs font-bold text-teal-600 sm:text-sm">
                    From ₱{lowestPrice.toFixed(2)}
                </p>

                <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
                    {stock <= 0
                        ? "Out of stock"
                        : "Tap to select size"}
                </p>
            </div>
        </div>
    );
};
