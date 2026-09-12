import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReadinessMeter from "../components/ReadinessMeter.jsx";

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const MiniBar = ({ label, value, meta }) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="font-mono text-xs text-ink/60">{meta || `${value ?? "-"}%`}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-mist">
      <div
        className="h-full rounded-full bg-signal transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
      />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load your dashboard right now."));
  }, []);

  const chartData = useMemo(() => {
    if (!data?.scoreHistory) return [];
    return data.scoreHistory.map((h, i) => ({
      name: h.date ? formatDate(h.date) : `#${i + 1}`,
      score: h.score,
      role: h.role,
      domain: h.domain,
    }));
  }, [data]);

  if (error) return <p className="page-shell text-alert">{error}</p>;
  if (!data) return <p className="page-shell text-ink/60">Loading your progress...</p>;

  const hasHistory = data.completedInterviews > 0;

  return (
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-kicker mb-3">Readiness dashboard</p>
          <h1 className="text-4xl font-bold">Hey {user?.name?.split(" ")[0]}, keep the next round close.</h1>
          <p className="mt-2 text-ink/60">Your practice, resume signal, and next best moves in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/interview" className="btn-signal">
            Start practice
          </Link>
          <Link to="/resume" className="btn-secondary">
            Check resume
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card md:col-span-2 xl:col-span-1">
          <p className="mb-3 text-sm text-ink/60">Average readiness</p>
          <ReadinessMeter score={data.averageScore ?? 0} label={data.readinessLabel || "not evaluated"} size="lg" />
        </div>
        <div className="metric-card">
          <p className="text-sm text-ink/60">Completed sessions</p>
          <p className="mt-3 font-mono text-4xl font-bold">{data.completedInterviews}</p>
          <p className="mt-1 text-xs text-ink/50">{data.totalInterviews} started</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-ink/60">Practice streak</p>
          <p className="mt-3 font-mono text-4xl font-bold">{data.practiceStreak || 0}</p>
          <p className="mt-1 text-xs text-ink/50">active days</p>
        </div>
        <div className="metric-card">
          <p className="mb-3 text-sm text-ink/60">Latest resume match</p>
          {data.latestResume ? (
            <ReadinessMeter score={data.latestResume.matchScore ?? 0} label="role match" compact />
          ) : (
            <Link to="/resume" className="text-sm font-semibold text-signal">
              Run first check
            </Link>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Score trend</p>
              <p className="text-xs text-ink/50">Completed sessions over time</p>
            </div>
            {hasHistory && <span className="chip">{data.completedInterviews} sessions</span>}
          </div>

          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#DDE1EA" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#131A2B" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#131A2B" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3D5AFE" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-md border border-dashed border-mist bg-paper/60 text-center">
              <div>
                <p className="font-semibold">{hasHistory ? "One score recorded" : "No completed session yet"}</p>
                <p className="mt-1 text-sm text-ink/60">Complete two sessions to unlock your trend line.</p>
              </div>
            </div>
          )}
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="text-sm font-semibold">Next best actions</p>
          <div className="mt-5 space-y-4">
            {(data.practicePlan || []).map((action, index) => (
              <div key={`${action.title}-${index}`} className="border-b border-mist pb-4 last:border-0 last:pb-0">
                <p className="font-semibold">{action.title}</p>
                <p className="mt-1 text-sm text-ink/60">{action.detail}</p>
                {action.href && (
                  <Link to={action.href} className="mt-2 inline-flex text-sm font-semibold text-signal">
                    {action.cta || "Open"}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6">
          <p className="text-sm font-semibold">Weak areas</p>
          <div className="mt-5 space-y-4">
            {data.weakAreas?.length ? (
              data.weakAreas.map((area, index) => (
                <div key={`${area.question}-${index}`} className="rounded-md border border-mist bg-paper/50 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="chip">{area.domain}</span>
                    <span className="chip">{area.difficulty}</span>
                    <span className="font-mono text-sm font-semibold text-alert">{area.score}/10</span>
                  </div>
                  <p className="text-sm font-medium">{area.question}</p>
                  <p className="mt-2 text-sm text-ink/60">{area.improvements?.[0] || area.feedback}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">Your lowest-scoring answers will appear here after a session.</p>
            )}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="text-sm font-semibold">Skill profile</p>
          <div className="mt-5 space-y-5">
            {data.topicBreakdown?.length ? (
              data.topicBreakdown.map((topic) => (
                <MiniBar
                  key={topic.domain}
                  label={topic.domain}
                  value={topic.averageScore}
                  meta={`${topic.averageScore}% · ${topic.sessions} session${topic.sessions === 1 ? "" : "s"}`}
                />
              ))
            ) : (
              <p className="text-sm text-ink/60">Practice across domains to build a profile.</p>
            )}

            {data.criteriaAverages?.length > 0 && (
              <div className="border-t border-mist pt-5">
                <p className="mb-4 text-sm font-semibold">Answer quality</p>
                <div className="space-y-4">
                  {data.criteriaAverages.map((criterion) => (
                    <MiniBar
                      key={criterion.key}
                      label={criterion.label}
                      value={(criterion.score ?? 0) * 10}
                      meta={`${criterion.score}/10`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">Recent sessions</p>
          <Link to="/interview" className="text-sm font-semibold text-signal">
            New session
          </Link>
        </div>

        {data.recentInterviews.length === 0 ? (
          <p className="text-sm text-ink/60">Start a mock interview to build your first readiness score.</p>
        ) : (
          <ul className="divide-y divide-mist">
            {data.recentInterviews.map((iv) => (
              <li key={iv._id} className="grid gap-3 py-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">
                    {iv.role} · {iv.domain}
                  </p>
                  <p className="text-ink/50">{new Date(iv.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="font-mono font-semibold">
                  {iv.status === "completed" ? `${iv.overallScore}/100` : "In progress"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
