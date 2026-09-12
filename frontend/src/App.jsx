import { Routes, Route, Navigate, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ReadinessMeter from "./components/ReadinessMeter.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Interview from "./pages/Interview.jsx";
import Resume from "./pages/Resume.jsx";
import CareerResources from "./pages/CareerResources.jsx";

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.8fr)] lg:items-center">
        <div>
          <p className="page-kicker mb-3">AI interview readiness</p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight">
            SmartHire
            <span className="mt-2 block text-3xl text-signal sm:text-4xl">Practice, speak, score, improve.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            Run role-specific mock interviews, answer by voice, analyze your resume, and turn every result into a
            focused next step before the real round.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={user ? "/interview" : "/signup"}
              className="btn-primary px-6 py-3"
            >
              {user ? "Start practice" : "Get started free"}
            </Link>
            <Link to="/resources" className="btn-secondary px-6 py-3">
              Open playbook
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Voice mode", "Browser speech-to-text practice"],
              ["Coach scoring", "Correctness, clarity, structure"],
              ["Action plan", "Weak areas and resume gaps"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-md border border-mist bg-white/75 p-4">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-ink/60">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Readiness snapshot</p>
              <p className="text-xs text-ink/60">Sample candidate view</p>
            </div>
            <span className="chip">Live prep</span>
          </div>
          <ReadinessMeter score={78} label="Almost There" size="lg" />
          <div className="mt-8 space-y-4 text-sm">
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-ink/60">DSA</span>
                <span className="font-mono font-semibold">82/100</span>
              </div>
              <div className="h-2 rounded-full bg-mist">
                <div className="h-2 rounded-full bg-momentum" style={{ width: "82%" }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-ink/60">System Design</span>
                <span className="font-mono font-semibold">71/100</span>
              </div>
              <div className="h-2 rounded-full bg-mist">
                <div className="h-2 rounded-full bg-signal" style={{ width: "71%" }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-ink/60">Resume match</span>
                <span className="font-mono font-semibold">80%</span>
              </div>
              <div className="h-2 rounded-full bg-mist">
                <div className="h-2 rounded-full bg-momentum" style={{ width: "80%" }} />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-md border border-signal/25 bg-signal/5 p-4 text-sm text-ink/70">
            Next best action: record one system design answer out loud and tighten the trade-off section.
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            }
          />
          <Route path="/resources" element={<CareerResources />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
