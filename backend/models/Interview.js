import mongoose from "mongoose";

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    feedback: { type: String, default: "" },
    score: { type: Number, min: 0, max: 10, default: null }, // per-question score
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true }, // e.g. SDE, Data Analyst, HR Round
    domain: { type: String, default: "General" }, // e.g. DSA, System Design, Behavioral
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    questions: [qaSchema],
    overallScore: { type: Number, min: 0, max: 100, default: null },
    readinessLabel: { type: String, default: "" }, // e.g. "Needs Practice", "Interview Ready"
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
