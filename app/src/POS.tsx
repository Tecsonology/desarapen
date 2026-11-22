
import React, { useEffect, useState } from "react";
import ReceiptModal from "./ReceiptModal";
import Payment from "./Payment";
import { getProducts, updateProduct } from "./api/productService";
import { createOrder } from "./api/orderService";
import type { CreateOrder } from "./api/orderService";
import { createQueue } from "./api/queueService";
import type { Queue, QueueOrder } from "./types/queueTypes";

import { ArrowLeft } from "lucide-react";

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
  showNav?: ()=> void
}

// ==========================================
// POS COMPONENT
// ==========================================

function POS({showNav} : PosProp) {
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
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ==========================================
  // CALCULATE AVAILABLE STOCK
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
  // ADD SELECTED SIZE TO CART
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

    const availableStock = getAvailableStock(product);

    if (availableStock <= 0) {
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

    // Refresh products after successful checkout.
    // This gets the actual stock from MongoDB.
    const updatedProducts = products.map((product)=> {
      const purchasedQuantity = cartItems
        .filter((item)=> item._id === product._id)
        .reduce((sum, item)=> sum + item.quantity, 0)

        return {
          ...product,
          stock: product.stock - purchasedQuantity
        }
    })

    for(const product of updatedProducts){
      const originalProduct = products.find(
        (item) => item._id === product._id
      )

      if(originalProduct && originalProduct.stock !== product.stock){
        await updateProduct(product._id, {
          stock: product.stock
        })
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

      // Save a snapshot before clearing cart.
      const receiptItems = [...cartItems];

      // Save order and refresh inventory.
      await orderSuccess(cash);

      const queueItems: QueueOrder[] = cartItems.map((item) => ({
        productName: item.name,
        category: item.category,
        quantity: item.quantity,
        size: item.selectedSize.volume,
        price: item.selectedSize.price,
        subtotal: item.selectedSize.price * item.quantity,
      }));


      const sendQueue = await createQueue({
        orders: queueItems,
        status: "pending"
      })

      console.log(sendQueue)
      


      // Update receipt details after successful order.
      setLastReceipt(receiptItems);
      setReceiptNumber(`REC-${Date.now()}`);
      setCashReceived(cash);

      // Clear cart only after successful order.
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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="flex flex-col md:flex-row w-full p-4 gap-4 h-screen bg-gray-100">

      {/* ======================================
          PRODUCT GRID
      ====================================== */}

      <div className="menu-container w-full md:w-2/3 overflow-y-auto">

        <div className="flex flex-row items-center mb-3 gap-4">
          <button className="w-8 h-8 p-2 bg-slate-400 flex justify-center items-center rounded-[50%]">
            <ArrowLeft className="font-bold" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
          Products
        </h2>

        </div>

        {/* CATEGORY FILTER */}

        <div className="flex flex-wrap text-white gap-1 mb-3">
          {categories.map((item) => (
            <button
              key={item}
              className={`rounded-sm px-3 py-2 text-sm ${
                selectedCategory === item
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
              onClick={() => setSelectedCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* LOADING */}

        {loading && (
          <p className="text-gray-500 py-5">
            Loading products...
          </p>
        )}

        {/* ERROR */}

        {error && (
          <p className="text-red-500 py-5">
            {error}
          </p>
        )}

        {/* PRODUCTS */}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">

            {filteredProducts.map((item) => {
              const availableStock = getAvailableStock(item);

              return (
                <button
                  key={item._id}
                  onClick={() => openSizeSelection(item)}
                  className="text-left"
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
              <p className="col-span-full text-center text-gray-400 py-10">
                No products available.
              </p>
            )}

          </div>
        )}
      </div>

      {/* ======================================
          CART SECTION
      ====================================== */}

      {!payment && (
        <div className="cart-container w-full md:w-1/3 bg-gray-900 text-white p-4 rounded-lg flex flex-col justify-between overflow-hidden">

          <div className="cart-items overflow-y-auto">

            {/* CART HEADER */}

            <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">

              <div>
                <h1 className="text-xl font-bold">
                  Cart
                </h1>

                <p className="text-xs text-gray-400">
                  {totalItems} items
                </p>
              </div>

              <button
                onClick={clearCart}
                disabled={cartItems.length === 0}
                className="text-sm text-red-400 hover:text-red-300 disabled:opacity-30"
              >
                Clear all
              </button>

            </div>

            {/* CART CONTENT */}

            {cartItems.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-16 text-gray-500">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-sm">No items in cart.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={`${item._id}-${item.selectedSize.id}`}
                  className="flex justify-between items-center gap-3 border-b border-gray-700 py-3"
                >

                  {/* PRODUCT DETAILS */}

                  <div className="flex-1 min-w-0">

                    <h3 className="font-semibold text-sm truncate">
                      {item.name}
                    </h3>

                    <p className="text-xs text-emerald-400">
                      {item.selectedSize.name} ({item.selectedSize.volume})
                    </p>

                    <p className="text-xs text-gray-400">
                      ₱{item.selectedSize.price.toFixed(2)} x {item.quantity}
                    </p>

                    <p className="font-bold text-sm mt-1">
                      ₱{(
                        item.selectedSize.price * item.quantity
                      ).toFixed(2)}
                    </p>

                  </div>

                  {/* QUANTITY CONTROLS */}

                  <div className="flex items-center gap-2">

                    <button
                      onClick={() =>
                        decreaseQuantity(
                          item._id,
                          item.selectedSize.id
                        )
                      }
                      className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600"
                    >
                      -
                    </button>

                    <span className="text-sm font-bold w-5 text-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        increaseQuantity(
                          item._id,
                          item.selectedSize.id
                        )
                      }
                      disabled={getAvailableStock(
                        products.find(
                          (product) => product._id === item._id
                        )!
                      ) <= 0}
                      className="w-7 h-7 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30"
                    >
                      +
                    </button>

                    <button
                      onClick={() =>
                        removeItem(
                          item._id,
                          item.selectedSize.id
                        )
                      }
                      className="text-red-400 hover:text-red-300 ml-1"
                    >
                      ✕
                    </button>

                  </div>
                </div>
              ))
            )}

          </div>

          {/* CART SUMMARY */}

          <div className="cart-summary border-t border-gray-700 pt-4 mt-4">

            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between font-bold text-xl mb-4">
              <span>Total:</span>

              <span className="text-emerald-400">
                ₱{total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setPayment(true)}
              disabled={cartItems.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition"
            >
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
          className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4"
          onClick={() => setSelectedProduct(null)}
        >

          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex justify-between items-start mb-4">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Select Size
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedProduct.name}
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

            </div>

            {/* PRODUCT IMAGE */}

            <div className="w-full h-36 bg-gray-100 rounded-lg overflow-hidden mb-5 flex justify-center items-center">

              {selectedProduct.image ? (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400">
                  No Image
                </span>
              )}

            </div>

            {/* SIZE OPTIONS */}

            <div className="grid grid-cols-3 gap-3">

              {selectedProduct.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() =>
                    addToCart(selectedProduct, size)
                  }
                  className="border border-gray-200 rounded-lg p-3 hover:border-emerald-500 hover:bg-emerald-50 transition flex flex-col items-center gap-2"
                >

                  <span className="text-sm font-bold text-gray-800">
                    {size.name}
                  </span>

                  <span className="text-xs text-gray-500">
                    {size.volume}
                  </span>

                  <span className="text-lg font-bold text-emerald-600">
                    ₱{size.price.toFixed(2)}
                  </span>

                  <span className="text-xs text-gray-400">
                    Select
                  </span>

                </button>
              ))}

            </div>

            {/* MODAL FOOTER */}

            <div className="mt-5 pt-4 border-t border-gray-100">

              <p className="text-xs text-gray-400 text-center">
                Available stock: {getAvailableStock(selectedProduct)}
              </p>

              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full mt-3 py-2 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition"
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
        items={lastReceipt}
        receiptNumber={receiptNumber}
        cashReceived={cashReceived}
      />

      {/* ======================================
          PAYMENT MODAL
      ====================================== */}

      {payment && (
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
      )}

      {/* PROCESSING OVERLAY */}

      {processingOrder && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <p className="font-semibold text-gray-800">
              Processing order...
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col justify-between hover:shadow-md transition cursor-pointer">

      {/* PRODUCT IMAGE */}

      <div className="w-full h-30 bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center">

        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400">
            No Image
          </span>
        )}

      </div>

      {/* PRODUCT DETAILS */}

      <div>

        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 inline-block mb-1">
          {category}
        </span>

        <h3 className="font-bold text-sm text-[#1A1A1A] leading-tight mb-1">
          {name}
        </h3>

      </div>

      {/* PRICE AND STOCK */}

      <div className="mt-2 pt-2 border-t border-gray-100">

        <div className="flex justify-between items-center gap-1">


          <span
            className={`text-xs font-semibold ${
              stock <= 0
                ? "text-red-500"
                : stock <= 10
                ? "text-yellow-600"
                : "text-gray-500"
            }`}
          >
            Stock: {stock}
          </span>

           <p className="text-[10px] text-emerald-600 font-medium mt-1">
          {stock <= 0 ? "Out of stock" : "Select a size"}
        </p>

        </div>

       

      </div>

    </div>
  );
};
