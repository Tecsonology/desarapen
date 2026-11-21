
const express = require("express");


const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController.js");

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// CREATE
router.post("/", verifyToken, authorizeRoles("superadmin", "admin"), createProduct);

// GET ALL
router.get("/", getProducts);

// SEARCH
router.get("/search", searchProducts);

// GET SINGLE
router.get("/:id", getProductById);

// UPDATE
router.put("/:id", verifyToken, authorizeRoles("superadmin", "admin", "employee"), updateProduct);

// DELETE
router.delete("/:id", verifyToken, authorizeRoles("superadmin", "admin"), deleteProduct);

module.exports = router;
