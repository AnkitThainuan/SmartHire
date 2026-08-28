import express from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

export default router;
