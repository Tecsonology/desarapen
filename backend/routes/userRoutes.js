
const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  loginUser,
  logoutUser
} = require("../controllers/userController");

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

// Create user
router.post(
  "/",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  createUser
);

// Get all users
router.get(
  "/",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  getUsers
);

router.post("/login", loginUser);

// Get user by ID
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  getUserById
);

// Update user
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  updateUser
);

// Change password
router.patch(
  "/:id/password",
  verifyToken,
  changePassword
);

// Delete user (superadmin only)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("superadmin"),
  deleteUser
);

router.post("/logout", logoutUser);

module.exports = router;
