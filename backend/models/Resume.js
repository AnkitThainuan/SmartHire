import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    extractedSkills: [{ type: String }],
    targetRole: { type: String, default: "" },
    matchScore: { type: Number, min: 0, max: 100, default: null }, // keyword/ATS-style match %
    missingKeywords: [{ type: String }],
    suggestions: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
