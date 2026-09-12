import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't log in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.6fr)] lg:items-center">
        <section>
          <p className="page-kicker mb-3">Welcome back</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Pick up exactly where your prep left off.</h1>
          <p className="mt-4 max-w-xl text-ink/60">
            Continue mock interviews, resume checks, and readiness tracking from your candidate dashboard.
          </p>
        </section>

        <section className="panel p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
              />
            </div>

            {error && <p className="text-sm text-alert">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink/60">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-signal">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
