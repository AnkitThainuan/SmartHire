import express from "express";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getMyInterviews,
  getInterviewById,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/start", startInterview);
router.get("/", getMyInterviews);
router.get("/:id", getInterviewById);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeInterview);

export default router;
