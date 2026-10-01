import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
} from "../services/userService.js";
import {
  deleteFbAccount,
  listFbAccounts,
} from "../services/fbAccountService.js";

import bcrypt from "bcryptjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (password) => {
  if (typeof password !== "string" || !password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (password.length > 72) {
    return "Password must be at most 72 characters";
  }
  return null;
};

// Register
export const register = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (name.length > 120) {
    return res.status(400).json({ message: "Name is too long" });
  }
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const existing = await findUserByEmail(email);

    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, passwordHash });

    req.session.userId = user.id;

    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Could not create account" });
  }
};

// Login
export const login = async (req, res) => {
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Rotate session id on login to prevent session fixation
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regenerate error:", error.message);
        return res.status(500).json({ message: "Could not sign in" });
      }

      req.session.userId = user.id;
      res.json({ user: toPublicUser(user) });
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Could not sign in" });
  }
};

// Current session
export const me = async (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json({ user: null, fbAccounts: [] });
  }

  try {
    const user = await findUserById(req.session.userId);

    if (!user) {
      // Session references a user that no longer exists
      req.session.destroy(() => {});
      return res.status(200).json({ user: null, fbAccounts: [] });
    }

    const fbAccounts = await listFbAccounts(req.session.userId);

    res.json({ user: toPublicUser(user), fbAccounts });
  } catch (error) {
    console.error("Session error:", error.message);
    res.status(500).json({ message: "Could not load session" });
  }
};

// Logout
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ user: null, fbAccounts: [] });
  });
};

// List connected Facebook accounts
export const getFbAccounts = async (req, res) => {
  const accounts = await listFbAccounts(req.session.userId);
  res.json({ fbAccounts: accounts });
};

// Disconnect one Facebook account
export const disconnectFbAccount = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid account id" });
  }

  try {
    // Scoped delete: the AND user_id prevents disconnecting someone else's account
    const deleted = await deleteFbAccount(req.session.userId, id);

    if (!deleted) {
      return res.status(404).json({ message: "Facebook account not found" });
    }

    res.json({ fbAccounts: await listFbAccounts(req.session.userId) });
  } catch (error) {
    console.error("Disconnect error:", error.message);
    res.status(500).json({ message: "Could not disconnect account" });
  }
};