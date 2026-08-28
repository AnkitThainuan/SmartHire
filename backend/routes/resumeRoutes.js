import express from "express";
import multer from "multer";
import path from "path";
import { uploadAndAnalyzeResume, getMyResumes } from "../controllers/resumeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === ".pdf") cb(null, true);
    else cb(new Error("Only PDF resumes are supported"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(protect);

router.post("/analyze", upload.single("resume"), uploadAndAnalyzeResume);
router.get("/", getMyResumes);

export default router;
