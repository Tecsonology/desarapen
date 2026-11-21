
const User = require("../models/UserModel");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields.",
      });
    }

    const allowedRoles = ["superadmin", "admin", "employee"];

    const userRole = role || "employee";

    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        message: "Invalid user role.",
      });
    }

    // Prevent public registration of privileged accounts.
    if (
      ["superadmin", "admin"].includes(userRole) &&
      (!req.user || req.user.role !== "superadmin")
    ) {
      return res.status(403).json({
        message: "Only a superadmin can create admin or superadmin accounts.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: userRole,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      message: "User created successfully.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      message: "Failed to create user.",
      error: error.message,
    });
  }
};

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve users.",
      error: error.message,
    });
  }
};

// GET SINGLE USER
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve user.",
      error: error.message,
    });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { name, username, email, role, status } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (role && !["superadmin", "admin", "employee"].includes(role)) {
      return res.status(400).json({
        message: "Invalid user role.",
      });
    }

    // Only superadmin can change roles.
    if (role && req.user.role !== "superadmin") {
      return res.status(403).json({
        message: "Only superadmin can change user roles.",
      });
    }

    // Prevent an admin from changing a superadmin account.
    if (
      req.user.role !== "superadmin" &&
      user.role === "superadmin"
    ) {
      return res.status(403).json({
        message: "You cannot modify a superadmin account.",
      });
    }

    if (username) user.username = username;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: "User updated successfully.",
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update user.",
      error: error.message,
    });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userId = req.params.id;

    // Users can change only their own password.
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        message: "You can only change your own password.",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide current and new passwords.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to change password.",
      error: error.message,
    });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        message: "Superadmin accounts cannot be deleted through this route.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    // Check account status
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Contact your administrator.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    })

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
};

exports.logoutUser = async ( req, res) => {
  res.clearCookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    })

    return res.status(200).json({
    message: "Logged out successfully.",
  });
}
