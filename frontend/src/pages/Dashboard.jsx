import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReadinessMeter from "../components/ReadinessMeter.jsx";

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

  if (error) return <p className="max-w-6xl mx-auto px-6 py-16 text-alert">{error}</p>;
  if (!data) return <p className="max-w-6xl mx-auto px-6 py-16 text-ink/60">Loading your progress…</p>;

  const chartData = data.scoreHistory.map((h, i) => ({
    name: `#${i + 1}`,
    score: h.score,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-1">Hey {user?.name?.split(" ")[0]}, here's where you stand</h1>
      <p className="text-ink/60 mb-10">Your readiness snapshot, updated after every mock session.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-mist p-6">
          <p className="text-sm text-ink/60 mb-3">Average readiness score</p>
          <ReadinessMeter score={data.averageScore ?? 0} label="out of 100" size="lg" />
        </div>
        <div className="bg-white rounded-xl border border-mist p-6">
          <p className="text-sm text-ink/60 mb-3">Completed sessions</p>
          <p className="font-mono text-4xl font-bold">{data.completedInterviews}</p>
        </div>
        <div className="bg-white rounded-xl border border-mist p-6">
          <p className="text-sm text-ink/60 mb-3">Total sessions started</p>
          <p className="font-mono text-4xl font-bold">{data.totalInterviews}</p>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-xl border border-mist p-6 mb-10">
          <p className="text-sm font-medium mb-4">Score trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#DDE1EA" strokeDasharray="4 4" />
              <XAxis dataKey="name" stroke="#131A2B" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#131A2B" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3D5AFE" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-mist p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium">Recent sessions</p>
          <Link to="/interview" className="text-signal text-sm font-medium">Start a new one →</Link>
        </div>

        {data.recentInterviews.length === 0 ? (
          <p className="text-ink/60 text-sm">
            You haven't run a mock interview yet. Start one to build your first readiness score.
          </p>
        ) : (
          <ul className="divide-y divide-mist">
            {data.recentInterviews.map((iv) => (
              <li key={iv._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{iv.role} · {iv.domain}</p>
                  <p className="text-ink/50">{new Date(iv.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="font-mono font-semibold">
                  {iv.status === "completed" ? `${iv.overallScore}/100` : "In progress"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.latestResume && (
        <div className="bg-white rounded-xl border border-mist p-6">
          <p className="text-sm font-medium mb-2">Latest resume check</p>
          <p className="text-ink/60 text-sm mb-3">{data.latestResume.fileName}</p>
          <ReadinessMeter score={data.latestResume.matchScore ?? 0} label="role match" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
