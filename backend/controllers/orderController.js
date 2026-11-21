
const Order = require("../models/OrderModel.js");
const Product = require("../models/ProductModel.js");

// ==========================================
// CREATE ORDER / CHECKOUT
// ==========================================
const createOrder = async (req, res) => {
  try {
    const {
      items,
      discount = 0,
      paymentMethod,
      cashReceived = 0,
      notes = "",
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one product.",
      });
    }

    if (!["Cash", "GCash", "Card"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount.",
      });
    }

    // Validate products and calculate prices using database values
    const orderItems = [];

    for (const item of items) {
      const { productId, quantity, size } = item;

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity.",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${productId} not found.`,
        });
      }

      if (product.status !== "active") {
        return res.status(400).json({
          success: false,
          message: `${product.name} is inactive.`,
        });
      }

      let unitPrice = product.price;
      let selectedSize = undefined;

      if (size?.id) {
        const matchedSize = product.sizes.find(
          (s) => s.id === size.id
        );

        if (!matchedSize) {
          return res.status(400).json({
            success: false,
            message: `Invalid size for ${product.name}.`,
          });
        }

        unitPrice = matchedSize.price;

        selectedSize = {
          id: matchedSize.id,
          name: matchedSize.name,
          volume: matchedSize.volume,
        };
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        barcode: product.barcode,
        size: selectedSize,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      });
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    if (discount > subtotal) {
      return res.status(400).json({
        success: false,
        message: "Discount cannot exceed subtotal.",
      });
    }

    const total = subtotal - discount;

    if (
      paymentMethod === "Cash" &&
      (!Number.isFinite(cashReceived) || cashReceived < total)
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient cash received.",
      });
    }

    const received =
      paymentMethod === "Cash" ? cashReceived : total;

    const change =
      paymentMethod === "Cash" ? received - total : 0;

    const order = await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      items: orderItems,
      subtotal,
      discount,
      total,
      paymentMethod,
      cashReceived: received,
      change,
      paymentStatus: "Paid",
      orderStatus: "Completed",
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET ALL ORDERS
// ==========================================
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("items.productId", "name barcode");

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE ORDER
// ==========================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name barcode");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!["Completed", "Cancelled"].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { orderStatus } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated.",
      order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// DELETE ORDER
// ==========================================
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
