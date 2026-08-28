import fs from "fs";
import pdfParse from "pdf-parse";
import Resume from "../models/Resume.js";
import { analyzeResume } from "../services/geminiService.js";

// @route POST /api/resumes/analyze  (multipart/form-data, field name: "resume")
// body fields: targetRole
export const uploadAndAnalyzeResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No resume file uploaded" });

    const { targetRole = req.user.targetRole || "" } = req.body;

    // Extract raw text from the uploaded PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(dataBuffer);
    const resumeText = parsed.text;

    const analysis = await analyzeResume({ resumeText, targetRole });

    const resume = await Resume.create({
      user: req.user._id,
      fileName: req.file.originalname,
      fileUrl: req.file.path, // swap for Cloudinary URL in production
      targetRole,
      extractedSkills: analysis.extractedSkills || [],
      matchScore: analysis.matchScore ?? null,
      missingKeywords: analysis.missingKeywords || [],
      suggestions: analysis.suggestions || [],
    });

    // Clean up local temp file after parsing
    fs.unlink(req.file.path, () => {});

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/resumes
export const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
