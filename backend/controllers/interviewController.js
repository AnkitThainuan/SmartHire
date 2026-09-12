import Interview from "../models/Interview.js";
import { generateQuestions, evaluateAnswer, readinessFromScore } from "../services/geminiService.js";

const clampNumber = (value, min, max, fallback = null) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

// @route POST /api/interviews/start
// body: { role, domain, difficulty, count }
export const startInterview = async (req, res) => {
  try {
    const { role, domain = "General", difficulty = "Medium", count = 5 } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required" });

    const questionTexts = await generateQuestions({ role, domain, difficulty, count });

    const interview = await Interview.create({
      user: req.user._id,
      role,
      domain,
      difficulty,
      questions: questionTexts.map((q) => ({ question: q })),
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/interviews/:id/answer
// body: { questionIndex, answer }
export const submitAnswer = async (req, res) => {
  try {
    const { questionIndex, answer, answerMode = "typed", durationSeconds, wordCount, paceWpm } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    const normalizedIndex = Number(questionIndex);

    if (!interview) return res.status(404).json({ message: "Interview session not found" });
    if (!Number.isInteger(normalizedIndex) || !interview.questions[normalizedIndex]) {
      return res.status(400).json({ message: "Invalid question index" });
    }
    if (!answer?.trim()) return res.status(400).json({ message: "Answer is required" });

    const evaluation = await evaluateAnswer({
      question: interview.questions[normalizedIndex].question,
      answer,
      role: interview.role,
    });

    interview.questions[normalizedIndex].answer = answer.trim();
    interview.questions[normalizedIndex].score = evaluation.score;
    interview.questions[normalizedIndex].feedback = evaluation.feedback;
    interview.questions[normalizedIndex].criteria = evaluation.criteria;
    interview.questions[normalizedIndex].strengths = evaluation.strengths;
    interview.questions[normalizedIndex].improvements = evaluation.improvements;
    interview.questions[normalizedIndex].followUpPrompt = evaluation.followUpPrompt;
    interview.questions[normalizedIndex].answerMode = answerMode === "voice" ? "voice" : "typed";
    interview.questions[normalizedIndex].durationSeconds = clampNumber(durationSeconds, 0, 60 * 60);
    interview.questions[normalizedIndex].wordCount = clampNumber(wordCount, 0, 20000);
    interview.questions[normalizedIndex].paceWpm = clampNumber(paceWpm, 0, 400);

    await interview.save();
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/interviews/:id/complete
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview session not found" });

    const scored = interview.questions.filter((q) => typeof q.score === "number");
    const avg =
      scored.length > 0
        ? Math.round((scored.reduce((sum, q) => sum + q.score, 0) / scored.length) * 10)
        : null; // scale 0-10 avg -> 0-100

    interview.overallScore = avg;
    interview.readinessLabel = readinessFromScore(avg);
    interview.status = "completed";

    await interview.save();
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/interviews
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/interviews/:id
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview session not found" });
    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
