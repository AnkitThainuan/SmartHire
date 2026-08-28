import { GoogleGenAI } from "@google/genai";

// Created lazily (on first use, not at import time) so this always picks up
// the real GEMINI_API_KEY value rather than risking a stale/undefined read
// if this module happens to load before .env is parsed.
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
 * Evaluate a single answer and return structured feedback + score.
 */
export const evaluateAnswer = async ({ question, answer, role }) => {
  const prompt = `
You are an expert interview coach evaluating a candidate's answer for a "${role}" interview.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer on correctness, clarity, and structure. Return ONLY valid JSON in this exact shape, no markdown fences:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentences of specific, constructive feedback>"
}
`;

  const text = cleanJson(await generate(prompt));

  try {
    return JSON.parse(text);
  } catch (err) {
    return { score: null, feedback: text };
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
