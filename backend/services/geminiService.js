import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-3.6-flash";
let _ai = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Check backend/.env and restart the server."
    );
  }
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
};

/**
 * Sends a text prompt to Gemini and returns the plain text response.
 */
const generate = async (prompt) => {
  const ai = getClient();
  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });
  return result.text;
};

/**
 * Strips markdown code fences from a model response so JSON.parse doesn't choke.
 */
const cleanJson = (text) => text.replace(/```json/g, "").replace(/```/g, "").trim();

const toNumberOrNull = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

/**
 * Generate a set of interview questions for a given role/domain/difficulty.
 */
export const generateQuestions = async ({ role, domain, difficulty, count = 5 }) => {
  const prompt = `
You are an expert technical interviewer. Generate ${count} interview questions for a candidate applying for the role of "${role}", focused on the domain "${domain}", at "${difficulty}" difficulty.

Return ONLY a JSON array of strings, nothing else, no markdown fences. Example:
["question 1", "question 2", "question 3"]
`;

  const text = cleanJson(await generate(prompt));

  try {
    return JSON.parse(text);
  } catch (err) {
    // Fallback: split by newlines if the model didn't return clean JSON
    return text
      .split("\n")
      .map((q) => q.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, count);
  }
};

/**
 * Generate a set of multiple-choice aptitude questions.
 * Each question has 4 options, exactly one correct, and a short explanation.
 */
export const generateMCQQuestions = async ({ topic, difficulty, count = 5 }) => {
  const prompt = `
You are an expert aptitude test setter for campus placements. Generate ${count} multiple-choice questions on the topic "${topic}", at "${difficulty}" difficulty, in the style of standard campus placement aptitude tests.

Return ONLY a JSON array, no markdown fences, in this exact shape:
[
  {
    "question": "<question text>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correctOptionIndex": <integer 0-3, index of the correct option in "options">,
    "explanation": "<1-2 sentence explanation of the correct answer>"
  }
]

Rules: exactly 4 options per question, exactly one correct answer, options should not repeat, keep questions self-contained (no images/diagrams needed).
`;

  const text = cleanJson(await generate(prompt));

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    return parsed
      .map((q) => {
        const options = toStringArray(q.options).slice(0, 4);
        const correctOptionIndex = toNumberOrNull(q.correctOptionIndex, 0, 3);
        if (options.length !== 4 || correctOptionIndex === null) return null;
        return {
          question: String(q.question || "").trim(),
          options,
          correctOptionIndex,
          explanation: String(q.explanation || "").trim(),
        };
      })
      .filter((q) => q && q.question)
      .slice(0, count);
  } catch (err) {
    // Fallback: a couple of safe generic aptitude questions so a demo never hard-fails
    return [
      {
        question: "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
        options: ["60 km/h", "75 km/h", "80 km/h", "90 km/h"],
        correctOptionIndex: 2,
        explanation: "Speed = distance / time = 60 km / 0.75 h = 80 km/h.",
      },
      {
        question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        options: ["36", "40", "42", "44"],
        correctOptionIndex: 2,
        explanation: "Differences are 4, 6, 8, 10, 12 — so 30 + 12 = 42.",
      },
    ].slice(0, count);
  }
};

/**
 * Evaluate a single answer and return structured feedback + score.
 */
export const evaluateAnswer = async ({ question, answer, role }) => {
  const prompt = `
You are an expert interview coach evaluating a candidate's answer for a "${role}" interview.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer on correctness, clarity, structure, specificity, and interview delivery. Return ONLY valid JSON in this exact shape, no markdown fences:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentences of specific, constructive feedback>",
  "criteria": {
    "correctness": <integer 0-10>,
    "clarity": <integer 0-10>,
    "structure": <integer 0-10>,
    "specificity": <integer 0-10>
  },
  "strengths": ["<short strength>", "<short strength>"],
  "improvements": ["<short improvement>", "<short improvement>"],
  "followUpPrompt": "<one realistic follow-up question the interviewer could ask next>"
}
`;

  const text = cleanJson(await generate(prompt));

  try {
    const parsed = JSON.parse(text);
    return {
      score: toNumberOrNull(parsed.score, 0, 10),
      feedback: String(parsed.feedback || "").trim(),
      criteria: {
        correctness: toNumberOrNull(parsed.criteria?.correctness, 0, 10),
        clarity: toNumberOrNull(parsed.criteria?.clarity, 0, 10),
        structure: toNumberOrNull(parsed.criteria?.structure, 0, 10),
        specificity: toNumberOrNull(parsed.criteria?.specificity, 0, 10),
      },
      strengths: toStringArray(parsed.strengths).slice(0, 3),
      improvements: toStringArray(parsed.improvements).slice(0, 3),
      followUpPrompt: String(parsed.followUpPrompt || "").trim(),
    };
  } catch (err) {
    return {
      score: null,
      feedback: text,
      criteria: { correctness: null, clarity: null, structure: null, specificity: null },
      strengths: [],
      improvements: ["Try answering with a clearer opening, concrete evidence, and a brief conclusion."],
      followUpPrompt: "",
    };
  }
};

/**
 * Analyze a resume's raw text against a target role and return skills + match info.
 */
export const analyzeResume = async ({ resumeText, targetRole }) => {
  const prompt = `
You are an ATS resume analyzer. Analyze the following resume text for a candidate targeting the role "${targetRole}".

Resume text:
"""
${resumeText.slice(0, 6000)}
"""

Return ONLY valid JSON in this exact shape, no markdown fences:
{
  "extractedSkills": ["skill1", "skill2"],
  "matchScore": <integer 0-100, how well the resume matches the target role>,
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

  const text = cleanJson(await generate(prompt));

  try {
    return JSON.parse(text);
  } catch (err) {
    return {
      extractedSkills: [],
      matchScore: null,
      missingKeywords: [],
      suggestions: ["Could not parse AI response. Please try again."],
    };
  }
};

/**
 * Compute an overall readiness label from an average score.
 */
export const readinessFromScore = (avgScore100) => {
  if (avgScore100 === null || avgScore100 === undefined) return "Not Evaluated";
  if (avgScore100 >= 80) return "Interview Ready";
  if (avgScore100 >= 60) return "Almost There";
  if (avgScore100 >= 40) return "Needs Practice";
  return "Needs Significant Work";
};
