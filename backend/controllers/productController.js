
const Product = require("../models/ProductModel.js");


// ==========================================
// CREATE PRODUCT
// ==========================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      barcode,
      price,
      costPrice,
      stock,
      unit,
      description,
      image,
      status,
      sizes,
    } = req.body;

    const existingProduct = await Product.findOne({ barcode });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Barcode already exists.",
      });
    }

    const product = await Product.create({
      name,
      category,
      barcode,
      price,
      costPrice,
      stock,
      unit,
      description,
      image,
      status,
      sizes,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET ALL PRODUCTS
// ==========================================
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE PRODUCT
// ==========================================
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE PRODUCT
// ==========================================
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// DELETE PRODUCT
// ==========================================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// SEARCH PRODUCTS
// ==========================================
const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ],
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
};
