import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-mist">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="flex items-end gap-0.5" aria-hidden="true">
            <span className="w-1 h-2 bg-alert rounded-sm" />
            <span className="w-1 h-3 bg-signal rounded-sm" />
            <span className="w-1 h-4 bg-signal rounded-sm" />
            <span className="w-1 h-5 bg-momentum rounded-sm" />
          </span>
          SmartHire
        </Link>

        {user ? (
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-signal">Dashboard</Link>
            <Link to="/interview" className="hover:text-signal">Mock Interview</Link>
            <Link to="/resume" className="hover:text-signal">Resume Check</Link>
            <Link to="/resources" className="hover:text-signal">Resources</Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md border border-mist hover:border-ink transition-colors"
            >
              Log out
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link to="/login" className="hover:text-signal">Log in</Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-md bg-ink text-paper hover:bg-signal transition-colors"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
