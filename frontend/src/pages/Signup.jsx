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
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-2">Create your account</h1>
      <p className="text-ink/60 mb-8">Set a target role and start practicing in minutes.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target role</label>
          <select
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md border border-mist bg-white focus:border-signal outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-alert text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-ink text-paper font-medium hover:bg-signal transition-colors disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-signal font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
