import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReadinessMeter from "../components/ReadinessMeter.jsx";

const Resume = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState(user?.targetRole || "");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/resumes").then((res) => setHistory(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF resume first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole);

      const { data } = await api.post("/resumes/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      setHistory([data, ...history]);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't analyze that resume. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Resume readiness check</h1>
      <p className="text-ink/60 mb-8">
        Upload a PDF resume and Gemini will score how well it matches your target role.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-mist p-6 space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1">Target role</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. SDE, Backend Developer"
            className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Resume (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm"
          />
        </div>

        {error && <p className="text-alert text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-signal text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze resume"}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl border border-mist p-6 mb-10">
          <p className="text-sm text-ink/60 mb-3">Match score for "{result.targetRole}"</p>
          <ReadinessMeter score={result.matchScore ?? 0} label="role match" size="lg" />

          {result.extractedSkills?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Skills detected</p>
              <div className="flex flex-wrap gap-2">
                {result.extractedSkills.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-paper border border-mist">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.missingKeywords?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-alert/10 text-alert border border-alert/30">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Suggestions</p>
              <ul className="list-disc list-inside text-sm text-ink/70 space-y-1">
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-mist p-6">
          <p className="text-sm font-medium mb-4">Past checks</p>
          <ul className="divide-y divide-mist">
            {history.map((r) => (
              <li key={r._id} className="py-3 flex items-center justify-between text-sm">
                <span>{r.fileName} · {r.targetRole}</span>
                <span className="font-mono font-semibold">{r.matchScore ?? "—"}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Resume;
