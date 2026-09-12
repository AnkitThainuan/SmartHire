import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = ["SDE", "Data Analyst", "Product Manager", "HR / Behavioral", "Other"];

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", targetRole: ROLES[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.7fr)] lg:items-center">
        <section>
          <p className="page-kicker mb-3">Candidate launchpad</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Build an interview plan around your target role.</h1>
          <p className="mt-4 max-w-xl text-ink/60">
            SmartHire turns role choice, resume gaps, and mock interview results into a readiness path.
          </p>
        </section>

        <section className="panel p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field"
              />
            </div>
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
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Target role</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setForm({ ...form, targetRole: role })}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                      form.targetRole === role ? "border-ink bg-ink text-paper" : "border-mist bg-white"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-alert">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink/60">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-signal">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Signup;
