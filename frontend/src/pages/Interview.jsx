import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import ReadinessMeter from "../components/ReadinessMeter.jsx";
import VoicePracticePanel from "../components/VoicePracticePanel.jsx";
import RoleSelect from "../components/RoleSelect.jsx";

const DOMAINS = [
  { label: "DSA", detail: "Algorithms, patterns, complexity" },
  { label: "System Design", detail: "Architecture, scale, trade-offs" },
  { label: "Behavioral", detail: "STAR stories and judgment" },
  { label: "Core CS Fundamentals", detail: "OS, DBMS, networks, OOP" },
  { label: "Project Deep-Dive", detail: "Resume projects under pressure" },
];

const APTITUDE_TOPICS = [
  { label: "Quantitative Aptitude", detail: "Numbers, percentages, time-speed-distance" },
  { label: "Logical Reasoning", detail: "Series, puzzles, arrangements" },
  { label: "Verbal Ability", detail: "Grammar, comprehension, vocabulary" },
  { label: "Data Interpretation", detail: "Tables, graphs, and charts" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_COUNTS = [3, 5, 7];
const MODES = [
  { key: "text", label: "Interview Q&A", detail: "Open-ended answers, coached like a real interviewer" },
  { key: "mcq", label: "Aptitude MCQs", detail: "Timed multiple-choice, instant right/wrong" },
];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const getWordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const hasEvidence = (text) =>
  /\b(example|project|built|designed|implemented|because|result|impact|metric|users|reduced|improved|increased)\b/i.test(
    text
  );

const hasStructure = (text) =>
  /\b(first|second|then|because|trade-off|tradeoff|finally|overall|so|therefore|result)\b/i.test(text);

const CriteriaBar = ({ label, value }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs text-ink/60">
      <span>{label}</span>
      <span className="font-mono">{value ?? "-"}/10</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-mist">
      <div
        className="h-full rounded-full bg-signal transition-all"
        style={{ width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%` }}
      />
    </div>
  </div>
);

const OPTION_LETTERS = ["A", "B", "C", "D"];

const Interview = () => {
  const [mode, setMode] = useState("text");
  const [setup, setSetup] = useState({ role: "SDE", domain: DOMAINS[0].label, difficulty: "Medium", count: 5 });
  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [usedVoice, setUsedVoice] = useState(false);

  // MCQ-only state
  const [selectedOption, setSelectedOption] = useState(null);
  const [mcqRevealed, setMcqRevealed] = useState(false);

  const topicList = mode === "mcq" ? APTITUDE_TOPICS : DOMAINS;

  useEffect(() => {
    // Keep the domain in sync with whichever topic list is active for the current mode.
    setSetup((s) => ({ ...s, domain: topicList[0].label }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!interview || interview.status === "completed") return undefined;

    const startedAt = Date.now();
    setQuestionStartedAt(startedAt);
    setElapsedSeconds(0);
    setUsedVoice(false);
    setSelectedOption(null);
    setMcqRevealed(false);

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [interview?._id, currentIndex, interview?.status]);

  const wordCount = useMemo(() => getWordCount(answer), [answer]);
  const paceWpm = elapsedSeconds > 0 ? Math.round(wordCount / (elapsedSeconds / 60)) : 0;
  const answerSignals = [
    { label: "Clear opener", met: wordCount >= 12 },
    { label: "Evidence", met: hasEvidence(answer) },
    { label: "Structure", met: hasStructure(answer) },
  ];

  const startSession = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/interviews/start", { ...setup, format: mode === "mcq" ? "mcq" : "text" });
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

    const durationSeconds = Math.max(0, Math.round((Date.now() - questionStartedAt) / 1000));
    const submittedWordCount = getWordCount(answer);
    const submittedPace = durationSeconds > 0 ? Math.round(submittedWordCount / (durationSeconds / 60)) : 0;

    try {
      const { data } = await api.post(`/interviews/${interview._id}/answer`, {
        questionIndex: currentIndex,
        answer,
        answerMode: usedVoice ? "voice" : "typed",
        durationSeconds,
        wordCount: submittedWordCount,
        paceWpm: submittedPace,
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

  const submitMcqAnswer = async () => {
    if (selectedOption === null) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/interviews/${interview._id}/answer`, {
        questionIndex: currentIndex,
        selectedOptionIndex: selectedOption,
      });
      setInterview(data);
      setMcqRevealed(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit that answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueAfterMcq = async () => {
    if (currentIndex + 1 < interview.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setLoading(true);
      try {
        const { data: completed } = await api.post(`/interviews/${interview._id}/complete`);
        setInterview(completed);
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't finish the session. Try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!interview) {
    return (
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section>
            <p className="page-kicker mb-3">Mock interview studio</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Practice the round before it counts.
            </h1>
            <p className="mt-4 max-w-2xl text-ink/65">
              Choose the role, topic, and pressure level. SmartHire will generate a focused session and score each
              answer like an interview coach.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    mode === m.key ? "border-signal bg-signal/5" : "border-mist bg-white hover:border-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="mt-1 block text-xs text-ink/60">{m.detail}</span>
                </button>
              ))}
            </div>

            <form onSubmit={startSession} className="panel mt-6 space-y-6 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-[1fr_150px]">
                <RoleSelect value={setup.role} onChange={(role) => setSetup({ ...setup, role })} />
                <div>
                  <label className="mb-1 block text-sm font-semibold">Questions</label>
                  <select
                    value={setup.count}
                    onChange={(e) => setSetup({ ...setup, count: Number(e.target.value) })}
                    className="field"
                  >
                    {QUESTION_COUNTS.map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {mode === "mcq" ? "Aptitude topic" : "Domain"}
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {topicList.map((domain) => (
                    <button
                      type="button"
                      key={domain.label}
                      onClick={() => setSetup({ ...setup, domain: domain.label })}
                      className={`rounded-md border p-4 text-left transition-colors ${
                        setup.domain === domain.label
                          ? "border-signal bg-signal/5 text-ink"
                          : "border-mist bg-white hover:border-ink"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{domain.label}</span>
                      <span className="mt-1 block text-xs text-ink/60">{domain.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Difficulty</label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((difficulty) => (
                    <button
                      type="button"
                      key={difficulty}
                      onClick={() => setSetup({ ...setup, difficulty })}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                        setup.difficulty === difficulty ? "border-ink bg-ink text-paper" : "border-mist bg-white"
                      }`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-alert">{error}</p>}

              <button type="submit" disabled={loading || !setup.role.trim()} className="btn-signal w-full">
                {loading ? "Generating questions..." : mode === "mcq" ? "Start aptitude quiz" : "Start interview"}
              </button>
            </form>
          </section>

          <aside className="panel-soft p-5">
            <p className="text-sm font-semibold">Session stack</p>
            <div className="mt-4 space-y-3 text-sm">
              {(mode === "mcq"
                ? ["AI-generated MCQs", "Instant right/wrong feedback", "Explanation per question", "Dashboard accuracy tracking"]
                : ["AI-generated questions", "Voice answers and playback", "Timed delivery metrics", "Follow-up prompts", "Dashboard weak-area plan"]
              ).map((item) => (
                <div key={item} className="flex items-center justify-between gap-4 border-b border-mist pb-3 last:border-0">
                  <span className="text-ink/70">{item}</span>
                  <span className="h-2 w-2 rounded-full bg-momentum" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  const isMcqSession = interview.questions[0]?.type === "mcq";

  if (interview.status === "completed") {
    const voiceAnswers = interview.questions.filter((q) => q.answerMode === "voice").length;
    const pacedAnswers = interview.questions.filter((q) => q.paceWpm);
    const averagePace = Math.round(
      interview.questions.reduce((sum, q) => sum + (q.paceWpm || 0), 0) / Math.max(1, pacedAnswers.length)
    );
    const correctCount = interview.questions.filter((q) => q.score === 10).length;
    const accuracy = Math.round((correctCount / interview.questions.length) * 100);

    return (
      <div className="page-shell">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker mb-3">Session complete</p>
            <h1 className="text-4xl font-bold">{isMcqSession ? "Your aptitude results" : "Your interview debrief"}</h1>
            <p className="mt-2 text-ink/60">
              {interview.role} · {interview.domain} · {interview.difficulty}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setInterview(null)} className="btn-secondary">
              Start another
            </button>
            <Link to="/dashboard" className="btn-primary">
              View dashboard
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="metric-card md:col-span-2">
            <p className="mb-3 text-sm text-ink/60">Overall readiness</p>
            <ReadinessMeter score={interview.overallScore ?? 0} label={interview.readinessLabel} size="lg" />
          </div>
          {isMcqSession ? (
            <>
              <div className="metric-card">
                <p className="text-sm text-ink/60">Correct answers</p>
                <p className="mt-3 font-mono text-4xl font-bold">
                  {correctCount}<span className="text-lg text-ink/40">/{interview.questions.length}</span>
                </p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-ink/60">Accuracy</p>
                <p className="mt-3 font-mono text-4xl font-bold">{accuracy}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="metric-card">
                <p className="text-sm text-ink/60">Voice answers</p>
                <p className="mt-3 font-mono text-4xl font-bold">{voiceAnswers}</p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-ink/60">Avg. pace</p>
                <p className="mt-3 font-mono text-4xl font-bold">{averagePace || "-"}</p>
                <p className="mt-1 text-xs text-ink/50">words/min</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          {interview.questions.map((q, i) =>
            q.type === "mcq" ? (
              <section key={i} className="panel p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">Question {i + 1}</p>
                    <h2 className="mt-2 text-lg font-semibold">{q.question}</h2>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-4 py-2 text-center text-sm font-semibold ${
                      q.score === 10 ? "bg-momentum/10 text-momentum" : "bg-alert/10 text-alert"
                    }`}
                  >
                    {q.score === 10 ? "Correct" : "Incorrect"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correctOptionIndex;
                    const isChosen = oi === q.selectedOptionIndex;
                    return (
                      <div
                        key={oi}
                        className={`rounded-md border px-4 py-2.5 text-sm ${
                          isCorrect
                            ? "border-momentum bg-momentum/10"
                            : isChosen
                            ? "border-alert bg-alert/10"
                            : "border-mist bg-white"
                        }`}
                      >
                        <span className="mr-2 font-mono text-xs text-ink/40">{OPTION_LETTERS[oi]}</span>
                        {opt}
                        {isCorrect && <span className="ml-2 text-xs font-semibold text-momentum">✓ correct</span>}
                        {isChosen && !isCorrect && <span className="ml-2 text-xs font-semibold text-alert">your pick</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-4 rounded-md border border-mist bg-paper/60 p-4 text-sm text-ink/70">
                    <span className="font-semibold">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </section>
            ) : (
              <section key={i} className="panel p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">Question {i + 1}</p>
                    <h2 className="mt-2 text-lg font-semibold">{q.question}</h2>
                    <p className="mt-3 text-sm text-ink/60">Your answer: {q.answer || "-"}</p>
                  </div>
                  <div className="shrink-0 rounded-md bg-paper px-4 py-3 text-center">
                    <p className="font-mono text-2xl font-bold text-signal">{q.score ?? "-"}/10</p>
                    <p className="text-xs text-ink/50">{q.answerMode === "voice" ? "voice" : "typed"}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className="text-sm font-semibold">Coach feedback</p>
                    <p className="mt-2 text-sm text-ink/70">{q.feedback}</p>

                    {q.followUpPrompt && (
                      <div className="mt-4 rounded-md border border-signal/25 bg-signal/5 p-4 text-sm text-ink/75">
                        <span className="font-semibold">Follow-up: </span>
                        {q.followUpPrompt}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <CriteriaBar label="Correctness" value={q.criteria?.correctness} />
                    <CriteriaBar label="Clarity" value={q.criteria?.clarity} />
                    <CriteriaBar label="Structure" value={q.criteria?.structure} />
                    <CriteriaBar label="Specificity" value={q.criteria?.specificity} />
                  </div>
                </div>

                {(q.strengths?.length > 0 || q.improvements?.length > 0) && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {q.strengths?.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold">Worked well</p>
                        <div className="flex flex-wrap gap-2">
                          {q.strengths.map((item, index) => (
                            <span className="chip border-momentum/40 bg-momentum/10" key={index}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.improvements?.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold">Improve next</p>
                        <div className="flex flex-wrap gap-2">
                          {q.improvements.map((item, index) => (
                            <span className="chip border-alert/35 bg-alert/10 text-alert" key={index}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          )}
        </div>
      </div>
    );
  }

  const question = interview.questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / interview.questions.length) * 100);

  // ----- MCQ practice screen -----
  if (question.type === "mcq") {
    return (
      <div className="page-shell">
        <div className="mx-auto max-w-2xl">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="chip">
                Question {currentIndex + 1} of {interview.questions.length}
              </span>
              <span className="chip">{interview.domain}</span>
              <span className="chip">{interview.difficulty}</span>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
            </div>

            <h1 className="text-xl font-semibold leading-snug sm:text-2xl">{question.question}</h1>

            <div className="mt-6 space-y-2.5">
              {question.options.map((opt, oi) => {
                const isChosen = selectedOption === oi;
                const isCorrect = oi === question.correctOptionIndex;
                let stateClass = "border-mist bg-white hover:border-signal";
                if (mcqRevealed) {
                  if (isCorrect) stateClass = "border-momentum bg-momentum/10";
                  else if (isChosen) stateClass = "border-alert bg-alert/10";
                  else stateClass = "border-mist bg-white opacity-60";
                } else if (isChosen) {
                  stateClass = "border-signal bg-signal/5";
                }

                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={mcqRevealed || loading}
                    onClick={() => setSelectedOption(oi)}
                    className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed ${stateClass}`}
                  >
                    <span className="font-mono text-xs text-ink/40">{OPTION_LETTERS[oi]}</span>
                    <span className="flex-1">{opt}</span>
                    {mcqRevealed && isCorrect && <span className="text-xs font-semibold text-momentum">✓</span>}
                    {mcqRevealed && isChosen && !isCorrect && <span className="text-xs font-semibold text-alert">✕</span>}
                  </button>
                );
              })}
            </div>

            {mcqRevealed && question.explanation && (
              <div className="mt-5 rounded-md border border-mist bg-paper/60 p-4 text-sm text-ink/70">
                <span className="font-semibold">
                  {question.selectedOptionIndex === question.correctOptionIndex ? "Correct — " : "Not quite — "}
                </span>
                {question.explanation}
              </div>
            )}

            {error && <p className="mt-4 text-sm text-alert">{error}</p>}

            <div className="mt-6">
              {!mcqRevealed ? (
                <button
                  onClick={submitMcqAnswer}
                  disabled={selectedOption === null || loading}
                  className="btn-signal w-full"
                >
                  {loading ? "Checking..." : "Submit answer"}
                </button>
              ) : (
                <button onClick={continueAfterMcq} disabled={loading} className="btn-signal w-full">
                  {loading ? "Finishing..." : currentIndex + 1 < interview.questions.length ? "Next question" : "Finish quiz"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ----- Text/voice practice screen (existing flow) -----
  return (
    <div className="page-shell">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <section className="panel p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="chip">
                Question {currentIndex + 1} of {interview.questions.length}
              </span>
              <span className="chip">{interview.role}</span>
              <span className="chip">{interview.domain}</span>
              <span className="chip">{formatTime(elapsedSeconds)}</span>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
            </div>

            <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{question.question}</h1>
          </section>

          <VoicePracticePanel
            question={question.question}
            answer={answer}
            setAnswer={setAnswer}
            onVoiceUsed={() => setUsedVoice(true)}
            disabled={loading}
          />

          <section className="panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Answer draft</p>
              <div className="flex flex-wrap gap-2 text-xs text-ink/60">
                <span>{wordCount} words</span>
                <span>{paceWpm || 0} wpm</span>
                <span>{usedVoice ? "voice" : "typed"}</span>
              </div>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={9}
              placeholder="Answer in the same words you would use with an interviewer."
              className="field min-h-[220px] resize-y"
            />
          </section>

          {error && <p className="text-sm text-alert">{error}</p>}

          <button onClick={submitAnswer} disabled={loading || !answer.trim()} className="btn-signal">
            {loading ? "Evaluating..." : currentIndex + 1 < interview.questions.length ? "Submit and continue" : "Submit and finish"}
          </button>
        </main>

        <aside className="space-y-5">
          <section className="panel p-5">
            <p className="text-sm font-semibold">Answer signals</p>
            <div className="mt-4 space-y-3">
              {answerSignals.map((signal) => (
                <div key={signal.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-ink/70">{signal.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${signal.met ? "bg-momentum" : "bg-mist"}`} />
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <p className="text-sm font-semibold">Delivery target</p>
            <div className="mt-4 space-y-3 text-sm text-ink/70">
              <div className="flex justify-between gap-3">
                <span>Length</span>
                <span className="font-mono">{wordCount < 45 ? "short" : wordCount > 180 ? "long" : "focused"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Pace</span>
                <span className="font-mono">
                  {paceWpm === 0 ? "-" : paceWpm < 90 ? "slow" : paceWpm > 170 ? "fast" : "steady"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Mode</span>
                <span className="font-mono">{usedVoice ? "voice" : "typed"}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Interview;
