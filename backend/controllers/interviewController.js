import Interview from "../models/Interview.js";
import { generateQuestions, evaluateAnswer, readinessFromScore } from "../services/geminiService.js";

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
    const { questionIndex, answer } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

    if (!interview) return res.status(404).json({ message: "Interview session not found" });
    if (!interview.questions[questionIndex]) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    const { score, feedback } = await evaluateAnswer({
      question: interview.questions[questionIndex].question,
      answer,
      role: interview.role,
    });

    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].score = score;
    interview.questions[questionIndex].feedback = feedback;

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
