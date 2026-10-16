import mongoose from "mongoose";

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ["text", "mcq"], default: "text" },
    answer: { type: String, default: "" },
    feedback: { type: String, default: "" },
    score: { type: Number, min: 0, max: 10, default: null }, // per-question score
    criteria: {
      correctness: { type: Number, min: 0, max: 10, default: null },
      clarity: { type: Number, min: 0, max: 10, default: null },
      structure: { type: Number, min: 0, max: 10, default: null },
      specificity: { type: Number, min: 0, max: 10, default: null },
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    followUpPrompt: { type: String, default: "" },
    answerMode: { type: String, enum: ["typed", "voice"], default: "typed" },
    durationSeconds: { type: Number, min: 0, default: null },
    wordCount: { type: Number, min: 0, default: null },
    paceWpm: { type: Number, min: 0, default: null },
    // MCQ-only fields (aptitude practice mode)
    options: [{ type: String }],
    correctOptionIndex: { type: Number, default: null },
    selectedOptionIndex: { type: Number, default: null },
    explanation: { type: String, default: "" },
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
