// MUST be the first import: ES module imports execute before any other code
// in this file, so if dotenv.config() ran below the other imports, every
// module that reads process.env at load time (like geminiService.js) would
// see undefined values. Importing "dotenv/config" here runs it as a
// side effect before those modules are even loaded.
import "dotenv/config";

import express from "express";
import cors from "cors";
import fs from "fs";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Ensure local uploads folder exists (temp storage before parsing resumes)
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "SmartHire API" }));

app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SmartHire API running on port ${PORT}`));
