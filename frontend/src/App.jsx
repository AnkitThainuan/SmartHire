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
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Walk into your next interview <span className="text-signal">already warmed up.</span>
          </h1>
          <p className="text-lg text-ink/70 mb-8">
            SmartHire runs AI mock interviews tailored to your target role, scores your resume
            against it, and tracks your readiness session over session — so you know exactly
            where you stand before the real thing.
          </p>
          <div className="flex gap-4">
            <Link
              to={user ? "/interview" : "/signup"}
              className="px-6 py-3 rounded-md bg-ink text-paper font-medium hover:bg-signal transition-colors"
            >
              {user ? "Start a mock interview" : "Get started free"}
            </Link>
            <Link
              to="/resources"
              className="px-6 py-3 rounded-md border border-mist font-medium hover:border-ink transition-colors"
            >
              Browse resources
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-mist p-8">
          <p className="text-sm text-ink/60 mb-4">Sample readiness score</p>
          <ReadinessMeter score={78} label="Almost There" size="lg" />
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">DSA</span>
              <span className="font-mono font-semibold">82/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">System Design</span>
              <span className="font-mono font-semibold">71/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Resume match</span>
              <span className="font-mono font-semibold">80%</span>
            </div>
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
