import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";
import { readinessFromScore } from "../services/geminiService.js";

const CRITERIA = ["correctness", "clarity", "structure", "specificity"];

const average = (values) => {
  const usable = values.filter((value) => typeof value === "number");
  if (!usable.length) return null;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
};

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

const getPracticeStreak = (completed) => {
  const days = [...new Set(completed.map((interview) => dayKey(interview.updatedAt || interview.createdAt)))].sort().reverse();
  if (!days.length) return 0;

  let streak = 1;
  let cursor = new Date(`${days[0]}T00:00:00.000Z`);

  for (let i = 1; i < days.length; i += 1) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (dayKey(cursor) !== days[i]) break;
    streak += 1;
  }

  return streak;
};

const buildPracticePlan = ({ completed, avgScore, weakAreas, latestResume, criteriaAverages }) => {
  const actions = [];
  const lowestCriterion = [...criteriaAverages].sort((a, b) => a.score - b.score)[0];

  if (!completed.length) {
    actions.push({
      title: "Start with a 5-question baseline",
      detail: "Run one medium session so SmartHire can identify your strongest and weakest areas.",
      href: "/interview",
      cta: "Start mock interview",
    });
  }

  if (weakAreas[0]) {
    actions.push({
      title: `Rework ${weakAreas[0].domain}`,
      detail: `Your lowest recent answer scored ${weakAreas[0].score}/10. Practice opening with the key idea, then support it with an example.`,
      href: "/interview",
      cta: "Practice weak area",
    });
  }

  if (lowestCriterion && lowestCriterion.score < 7) {
    actions.push({
      title: `Lift ${lowestCriterion.label.toLowerCase()}`,
      detail: "Use a 30-second answer frame: direct answer, evidence, trade-off, and close.",
      href: "/resources",
      cta: "Open drills",
    });
  }

  if (avgScore !== null && avgScore < 70) {
    actions.push({
      title: "Build consistency before harder rounds",
      detail: "Repeat medium sessions until your average readiness crosses 70, then move up difficulty.",
      href: "/interview",
      cta: "Run focused session",
    });
  }

  if (latestResume?.missingKeywords?.length) {
    actions.push({
      title: "Patch resume keyword gaps",
      detail: `Add proof for: ${latestResume.missingKeywords.slice(0, 3).join(", ")}.`,
      href: "/resume",
      cta: "Improve resume",
    });
  }

  if (actions.length < 3) {
    actions.push({
      title: "Record one answer out loud",
      detail: "Use voice mode on a behavioral or project deep-dive question to sharpen delivery.",
      href: "/interview",
      cta: "Try voice mode",
    });
  }

  return actions.slice(0, 4);
};

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
    const chronologicalCompleted = [...completed].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const domainStats = new Map();
    completed.forEach((interview) => {
      const existing = domainStats.get(interview.domain) || { total: 0, count: 0 };
      if (typeof interview.overallScore === "number") {
        existing.total += interview.overallScore;
        existing.count += 1;
      }
      domainStats.set(interview.domain, existing);
    });

    const topicBreakdown = [...domainStats.entries()]
      .map(([domain, stat]) => ({
        domain,
        averageScore: stat.count ? Math.round(stat.total / stat.count) : null,
        sessions: stat.count,
      }))
      .filter((topic) => topic.sessions > 0)
      .sort((a, b) => a.averageScore - b.averageScore);

    const scoredQuestions = completed.flatMap((interview) =>
      interview.questions
        .filter((question) => typeof question.score === "number")
        .map((question) => ({
          role: interview.role,
          domain: interview.domain,
          difficulty: interview.difficulty,
          question: question.question,
          score: question.score,
          feedback: question.feedback,
          improvements: question.improvements || [],
        }))
    );

    const weakAreas = scoredQuestions.sort((a, b) => a.score - b.score).slice(0, 4);

    const criteriaAverages = CRITERIA.map((criterion) => {
      const scores = completed.flatMap((interview) =>
        interview.questions
          .map((question) => question.criteria?.[criterion])
          .filter((score) => typeof score === "number")
      );
      return {
        key: criterion,
        label: criterion.charAt(0).toUpperCase() + criterion.slice(1),
        score: average(scores),
      };
    }).filter((criterion) => criterion.score !== null);

    const practicePlan = buildPracticePlan({
      completed,
      avgScore,
      weakAreas,
      latestResume,
      criteriaAverages,
    });

    res.json({
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      averageScore: avgScore,
      readinessLabel: readinessFromScore(avgScore),
      practiceStreak: getPracticeStreak(completed),
      scoreHistory: chronologicalCompleted.map((i) => ({
        date: i.createdAt,
        score: i.overallScore,
        role: i.role,
        domain: i.domain,
      })),
      topicBreakdown,
      weakAreas,
      criteriaAverages,
      practicePlan,
      recentInterviews: interviews.slice(0, 5),
      latestResume,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
