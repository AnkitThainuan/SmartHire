import Interview from "../models/Interview.js";
import { generateQuestions, generateMCQQuestions, evaluateAnswer, readinessFromScore } from "../services/geminiService.js";

const clampNumber = (value, min, max, fallback = null) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};


const sanitizeInterview = (interviewDoc) => {
  const interview = interviewDoc.toObject ? interviewDoc.toObject() : interviewDoc;
  return {
    ...interview,
    questions: interview.questions.map((q) => {
      if (q.type !== "mcq") return q;
      const answered = q.selectedOptionIndex !== null && q.selectedOptionIndex !== undefined;
      if (answered) return q;
      const { correctOptionIndex, explanation, ...rest } = q;
      return rest;
    }),
  };
};

// @route POST /api/interviews/start
// body: { role, domain, difficulty, count, format }
export const startInterview = async (req, res) => {
  try {
    const { role, domain = "General", difficulty = "Medium", count = 5, format = "text" } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required" });

    let questions;
    if (format === "mcq") {
      const mcqs = await generateMCQQuestions({ topic: domain, difficulty, count });
      questions = mcqs.map((q) => ({
        question: q.question,
        type: "mcq",
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      }));
    } else {
      const questionTexts = await generateQuestions({ role, domain, difficulty, count });
      questions = questionTexts.map((q) => ({ question: q, type: "text" }));
    }

    const interview = await Interview.create({
      user: req.user._id,
      role,
      domain,
      difficulty,
      questions,
    });

    res.status(201).json(sanitizeInterview(interview));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/interviews/:id/answer
// body (text mode): { questionIndex, answer, answerMode, durationSeconds, wordCount, paceWpm }
// body (mcq mode):  { questionIndex, selectedOptionIndex }
export const submitAnswer = async (req, res) => {
  try {
    const { questionIndex, answer, answerMode = "typed", durationSeconds, wordCount, paceWpm, selectedOptionIndex } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    const normalizedIndex = Number(questionIndex);

    if (!interview) return res.status(404).json({ message: "Interview session not found" });
    if (!Number.isInteger(normalizedIndex) || !interview.questions[normalizedIndex]) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    const targetQuestion = interview.questions[normalizedIndex];

    if (targetQuestion.type === "mcq") {
      const chosenIndex = Number(selectedOptionIndex);
      if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex >= targetQuestion.options.length) {
        return res.status(400).json({ message: "A valid option must be selected" });
      }

      const isCorrect = chosenIndex === targetQuestion.correctOptionIndex;
      targetQuestion.selectedOptionIndex = chosenIndex;
      targetQuestion.answer = targetQuestion.options[chosenIndex];
      targetQuestion.score = isCorrect ? 10 : 0;
      targetQuestion.feedback = targetQuestion.explanation;
    } else {
      if (!answer?.trim()) return res.status(400).json({ message: "Answer is required" });

      const evaluation = await evaluateAnswer({
        question: targetQuestion.question,
        answer,
        role: interview.role,
      });

      targetQuestion.answer = answer.trim();
      targetQuestion.score = evaluation.score;
      targetQuestion.feedback = evaluation.feedback;
      targetQuestion.criteria = evaluation.criteria;
      targetQuestion.strengths = evaluation.strengths;
      targetQuestion.improvements = evaluation.improvements;
      targetQuestion.followUpPrompt = evaluation.followUpPrompt;
      targetQuestion.answerMode = answerMode === "voice" ? "voice" : "typed";
      targetQuestion.durationSeconds = clampNumber(durationSeconds, 0, 60 * 60);
      targetQuestion.wordCount = clampNumber(wordCount, 0, 20000);
      targetQuestion.paceWpm = clampNumber(paceWpm, 0, 400);
    }

    await interview.save();
    res.json(sanitizeInterview(interview));
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
    res.json(sanitizeInterview(interview));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/interviews
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(interviews.map(sanitizeInterview));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/interviews/:id
export const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ message: "Interview session not found" });
    res.json(sanitizeInterview(interview));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
