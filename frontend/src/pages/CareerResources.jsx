import { useState } from "react";
import { Link } from "react-router-dom";

const RESOURCE_GROUPS = [
  {
    title: "SDE / Software Engineering",
    focus: "Problem solving, fundamentals, and project clarity",
    tips: [
      "Start every DSA answer with the brute force idea, then explain the optimized pattern.",
      "For projects, cover data flow, trade-offs, failure modes, and what you would improve next.",
      "Use complexity language only after the approach is clear.",
    ],
  },
  {
    title: "Data Analyst",
    focus: "Business framing, SQL, metrics, and insight quality",
    tips: [
      "Translate vague questions into a measurable metric before solving.",
      "Practice joins, window functions, cohorts, funnels, and anomaly explanation.",
      "Close every answer with a decision or recommendation.",
    ],
  },
  {
    title: "Product Manager",
    focus: "User thinking, prioritization, metrics, and trade-offs",
    tips: [
      "Frame product answers around user segment, pain, goal, and measurable success.",
      "Use prioritization criteria aloud so the interviewer can follow your judgment.",
      "Separate discovery, solution, launch, and learning risks.",
    ],
  },
  {
    title: "HR / Behavioral",
    focus: "STAR stories, self-awareness, and communication",
    tips: [
      "Prepare one story each for conflict, failure, leadership, ambiguity, and ownership.",
      "Keep the result concrete: numbers, user impact, stakeholder outcome, or lesson learned.",
      "End with what you would repeat or change next time.",
    ],
  },
];

const DRILLS = [
  {
    title: "60-second opener",
    detail: "Answer one question with a direct claim, two proof points, and a close.",
  },
  {
    title: "Follow-up pressure",
    detail: "After any answer, ask yourself one harder follow-up and respond without notes.",
  },
  {
    title: "Resume defense",
    detail: "Pick one bullet and explain context, contribution, metric, and trade-off.",
  },
  {
    title: "Correction round",
    detail: "Redo your lowest-scoring answer from the dashboard with a tighter structure.",
  },
];

const SPRINT = [
  "Baseline mock interview",
  "Resume keyword pass",
  "Weak-area technical drill",
  "Voice behavioral session",
  "Project deep-dive session",
  "Hard follow-up practice",
  "Final readiness check",
];

const CareerResources = () => {
  const [activeTrack, setActiveTrack] = useState(RESOURCE_GROUPS[0].title);
  const selected = RESOURCE_GROUPS.find((group) => group.title === activeTrack) || RESOURCE_GROUPS[0];

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-kicker mb-3">Career playbook</p>
          <h1 className="text-4xl font-bold">Practice with a sharper plan.</h1>
          <p className="mt-2 max-w-2xl text-ink/60">
            Use these drills between AI sessions to improve structure, delivery, and role fit.
          </p>
        </div>
        <Link to="/interview" className="btn-signal">
          Start mock interview
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="panel p-3">
          {RESOURCE_GROUPS.map((group) => (
            <button
              type="button"
              key={group.title}
              onClick={() => setActiveTrack(group.title)}
              className={`w-full rounded-md px-4 py-3 text-left text-sm transition-colors ${
                activeTrack === group.title ? "bg-ink font-semibold text-paper" : "text-ink/70 hover:bg-paper"
              }`}
            >
              {group.title}
            </button>
          ))}
        </aside>

        <section className="panel p-5 sm:p-6">
          <p className="text-sm text-ink/60">{selected.focus}</p>
          <h2 className="mt-1 text-2xl font-semibold">{selected.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {selected.tips.map((tip, i) => (
              <div key={tip} className="rounded-md border border-mist bg-paper/60 p-4">
                <p className="font-mono text-sm font-semibold text-signal">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-sm text-ink/75">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel p-5 sm:p-6">
          <p className="text-sm font-semibold">High-impact drills</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {DRILLS.map((drill) => (
              <div key={drill.title} className="border-b border-mist pb-4 last:border-0 md:last:border-b md:odd:border-b">
                <p className="font-semibold">{drill.title}</p>
                <p className="mt-1 text-sm text-ink/60">{drill.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="text-sm font-semibold">7-day sprint</p>
          <ol className="mt-5 space-y-3">
            {SPRINT.map((item, i) => (
              <li key={item} className="grid grid-cols-[34px_1fr] items-center gap-3 text-sm">
                <span className="rounded-md bg-paper px-2 py-1 text-center font-mono text-xs text-signal">
                  D{i + 1}
                </span>
                <span className="text-ink/75">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};

export default CareerResources;
