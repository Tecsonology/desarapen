const mongoose = require("mongoose")


const sizeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    volume: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Fruit Soda", "Fruit Milk", "Snack", "Iced Coffee"],
      required: true,
    },

    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    costPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      default: "pcs",
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    sizes: {
      type: [sizeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports =  Product;
