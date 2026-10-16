import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import ReadinessMeter from "../components/ReadinessMeter.jsx";
import RoleSelect from "../components/RoleSelect.jsx";

const Resume = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState(user?.targetRole || "");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/resumes")
      .then((res) => setHistory(res.data))
      .catch(() => {});
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
    <div className="page-shell">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-kicker mb-3">Resume readiness</p>
          <h1 className="text-4xl font-bold">Turn your resume into interview fuel.</h1>
          <p className="mt-2 max-w-2xl text-ink/60">
            Score role fit, expose missing keywords, and convert gaps into focused practice.
          </p>
        </div>
        <Link to="/interview" className="btn-secondary">
          Practice from gaps
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="panel p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <RoleSelect value={targetRole} onChange={setTargetRole} />

            <div>
              <label className="mb-2 block text-sm font-semibold">Resume PDF</label>
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-mist bg-paper/60 px-5 py-8 text-center transition-colors hover:border-signal">
                <span className="text-sm font-semibold">{file ? file.name : "Choose PDF resume"}</span>
                <span className="mt-1 text-xs text-ink/50">Up to 5 MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
            </div>

            {error && <p className="text-sm text-alert">{error}</p>}

            <button type="submit" disabled={loading} className="btn-signal w-full">
              {loading ? "Analyzing..." : "Analyze resume"}
            </button>
          </form>
        </section>

        <section className="panel p-5 sm:p-6">
          {result ? (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-ink/60">Match score for {result.targetRole || "target role"}</p>
                  <p className="mt-1 text-lg font-semibold">{result.fileName}</p>
                </div>
                <ReadinessMeter score={result.matchScore ?? 0} label="role match" size="lg" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold">Skills detected</p>
                  {result.extractedSkills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.extractedSkills.map((skill, i) => (
                        <span key={i} className="chip border-momentum/35 bg-momentum/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink/60">No skills detected yet.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Missing keywords</p>
                  {result.missingKeywords?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((keyword, i) => (
                        <span key={i} className="chip border-alert/35 bg-alert/10 text-alert">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink/60">No keyword gaps returned.</p>
                  )}
                </div>
              </div>

              {result.suggestions?.length > 0 && (
                <div className="mt-6 border-t border-mist pt-5">
                  <p className="mb-3 text-sm font-semibold">Rewrite priorities</p>
                  <ul className="space-y-3 text-sm text-ink/70">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="grid grid-cols-[28px_1fr] gap-3">
                        <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed border-mist bg-paper/60 text-center">
              <div>
                <p className="font-semibold">No resume check selected</p>
                <p className="mt-1 text-sm text-ink/60">Upload a PDF to see role fit and keyword gaps.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {history.length > 0 && (
        <section className="panel mt-8 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">Past checks</p>
            <span className="chip">{history.length} total</span>
          </div>
          <ul className="divide-y divide-mist">
            {history.map((r) => (
              <li key={r._id} className="grid gap-3 py-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">{r.fileName}</p>
                  <p className="text-ink/50">{r.targetRole || "Target role not set"}</p>
                </div>
                <span className="font-mono font-semibold">{r.matchScore ?? "-"}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Resume;
