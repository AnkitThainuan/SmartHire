import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 transition-colors ${
      isActive ? "bg-ink text-paper" : "text-ink/70 hover:bg-white hover:text-ink"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-mist bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:px-6 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex items-end gap-0.5" aria-hidden="true">
            <span className="w-1 h-2 bg-alert rounded-sm" />
            <span className="w-1 h-3 bg-signal rounded-sm" />
            <span className="w-1 h-4 bg-signal rounded-sm" />
            <span className="w-1 h-5 bg-momentum rounded-sm" />
          </span>
          SmartHire
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/interview" className={linkClass}>
              Practice
            </NavLink>
            <NavLink to="/resume" className={linkClass}>
              Resume
            </NavLink>
            <NavLink to="/resources" className={linkClass}>
              Playbook
            </NavLink>
            <button
              onClick={handleLogout}
              className="ml-1 rounded-md border border-mist bg-white px-3 py-2 transition-colors hover:border-ink"
            >
              Log out
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link to="/login" className="rounded-md px-3 py-2 text-ink/70 transition-colors hover:bg-white hover:text-ink">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary px-4 py-2">
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
