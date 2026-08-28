import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";

// @route GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    const completed = interviews.filter((i) => i.status === "completed");

    const avgScore =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length
          )
        : null;

    const latestResume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      averageScore: avgScore,
      scoreHistory: completed.map((i) => ({
        date: i.createdAt,
        score: i.overallScore,
        role: i.role,
      })),
      recentInterviews: interviews.slice(0, 5),
      latestResume,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
