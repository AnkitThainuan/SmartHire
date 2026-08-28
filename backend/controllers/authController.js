import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @route POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, targetRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password, targetRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      targetRole: user.targetRole,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      targetRole: user.targetRole,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/me
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/me
export const updateProfile = async (req, res) => {
  try {
    const { name, targetRole } = req.body;
    req.user.name = name ?? req.user.name;
    req.user.targetRole = targetRole ?? req.user.targetRole;
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
