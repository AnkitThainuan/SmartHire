import { useState } from "react";
import api from "../api/axios.js";
import ReadinessMeter from "../components/ReadinessMeter.jsx";

const DOMAINS = ["DSA", "System Design", "Behavioral", "Core CS Fundamentals", "Project Deep-Dive"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const Interview = () => {
  const [setup, setSetup] = useState({ role: "SDE", domain: DOMAINS[0], difficulty: "Medium", count: 5 });
  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startSession = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/interviews/start", setup);
      setInterview(data);
      setCurrentIndex(0);
      setAnswer("");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start the session. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/interviews/${interview._id}/answer`, {
        questionIndex: currentIndex,
        answer,
      });
      setInterview(data);
      setAnswer("");
      if (currentIndex + 1 < data.questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const { data: completed } = await api.post(`/interviews/${interview._id}/complete`);
        setInterview(completed);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit that answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Setup screen
  if (!interview) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Set up your mock interview</h1>
        <p className="text-ink/60 mb-8">Gemini generates fresh questions for the exact combo below.</p>

        <form onSubmit={startSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target role</label>
            <input
              value={setup.role}
              onChange={(e) => setSetup({ ...setup, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
              placeholder="e.g. SDE, Data Analyst"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Domain</label>
            <select
              value={setup.domain}
              onChange={(e) => setSetup({ ...setup, domain: e.target.value })}
              className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
            >
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setSetup({ ...setup, difficulty: d })}
                  className={`px-4 py-2 rounded-md border text-sm font-medium ${
                    setup.difficulty === d ? "bg-ink text-paper border-ink" : "border-mist"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-alert text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-signal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Generating questions…" : "Start interview"}
          </button>
        </form>
      </div>
    );
  }

  // Completed screen
  if (interview.status === "completed") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Session complete</h1>
        <p className="text-ink/60 mb-8">Here's how you did on {interview.role} · {interview.domain}.</p>

        <div className="bg-white rounded-xl border border-mist p-6 mb-8">
          <ReadinessMeter score={interview.overallScore ?? 0} label={interview.readinessLabel} size="lg" />
        </div>

        <div className="space-y-4">
          {interview.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-mist p-5">
              <p className="font-medium mb-2">{i + 1}. {q.question}</p>
              <p className="text-sm text-ink/60 mb-2">Your answer: {q.answer || "—"}</p>
              <div className="flex items-start gap-3 text-sm">
                <span className="font-mono font-semibold text-signal">{q.score ?? "—"}/10</span>
                <span className="text-ink/70">{q.feedback}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setInterview(null)}
          className="mt-8 px-5 py-2.5 rounded-md bg-ink text-paper font-medium hover:bg-signal transition-colors"
        >
          Start another session
        </button>
      </div>
    );
  }

  // Active question screen
  const question = interview.questions[currentIndex];
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-sm text-ink/50 mb-2">
        Question {currentIndex + 1} of {interview.questions.length} · {interview.role} · {interview.domain}
      </p>
      <h1 className="text-2xl font-semibold mb-6">{question.question}</h1>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={8}
        placeholder="Type your answer as you'd say it out loud…"
        className="w-full px-4 py-3 rounded-md border border-mist bg-white focus:border-signal outline-none"
      />

      {error && <p className="text-alert text-sm mt-2">{error}</p>}

      <button
        onClick={submitAnswer}
        disabled={loading || !answer.trim()}
        className="mt-4 px-5 py-2.5 rounded-md bg-signal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Evaluating…" : currentIndex + 1 < interview.questions.length ? "Submit & next question" : "Submit & finish"}
      </button>
    </div>
  );
};

export default Interview;
