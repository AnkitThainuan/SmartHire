const RESOURCE_GROUPS = [
  {
    title: "SDE / Software Engineering",
    tips: [
      "Practice explaining your approach out loud before coding — interviewers score communication, not just the final answer.",
      "Know your resume projects at a systems level: data flow, trade-offs, what you'd change with more time.",
      "Revise time/space complexity for the data structures you use most: arrays, hashmaps, trees, graphs.",
    ],
  },
  {
    title: "Data Analyst",
    tips: [
      "Be ready to walk through a past analysis end-to-end: question → data → method → insight → decision.",
      "Brush up on SQL joins, window functions, and basic statistics (mean vs median, correlation vs causation).",
      "Practice framing ambiguous business questions into a measurable metric.",
    ],
  },
  {
    title: "HR / Behavioral",
    tips: [
      "Structure answers with STAR (Situation, Task, Action, Result) — keep the Result concrete and quantified.",
      "Prepare one story each for: conflict, failure, leadership, and a tight deadline.",
      "Research the company's recent work so your 'why us' answer isn't generic.",
    ],
  },
];

const CareerResources = () => (
  <div className="max-w-4xl mx-auto px-6 py-16">
    <h1 className="text-3xl font-bold mb-2">Career resources</h1>
    <p className="text-ink/60 mb-10">Quick-reference tips by track — use these alongside your mock sessions.</p>

    <div className="space-y-8">
      {RESOURCE_GROUPS.map((group) => (
        <div key={group.title} className="bg-white rounded-xl border border-mist p-6">
          <h2 className="text-lg font-semibold mb-4">{group.title}</h2>
          <ul className="space-y-3">
            {group.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink/80">
                <span className="font-mono text-signal font-semibold shrink-0">{String(i + 1).padStart(2, "0")}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

export default CareerResources;
