import { useEffect, useRef, useState } from "react";


const DEFAULT_ROLES = ["SDE", "Data Analyst", "Product Manager", "HR / Behavioral", "DevOps / Cloud", "Other"];

const RoleSelect = ({ value, onChange, roles = DEFAULT_ROLES, label = "Target role" }) => {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(value && !roles.includes(value));
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (role) => {
    if (role === "Other") {
      setCustomMode(true);
      onChange("");
    } else {
      setCustomMode(false);
      onChange(role);
    }
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="mb-1 block text-sm font-semibold">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-0 border-b-2 border-mist bg-transparent px-1 pb-2 pt-1 text-left text-sm font-medium text-ink transition-colors hover:border-signal focus:border-signal focus:outline-none"
      >
        <span className={value ? "text-ink" : "text-ink/40"}>
          {value || "Select a target role"}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-ink/50 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-md border border-mist bg-white shadow-lg">
          {roles.map((role) => (
            <button
              type="button"
              key={role}
              onClick={() => handlePick(role)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-paper ${
                value === role ? "font-semibold text-signal" : "text-ink/80"
              }`}
            >
              {role}
              {value === role && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {customMode && (
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your target role"
          className="field mt-2"
        />
      )}
    </div>
  );
};

export default RoleSelect;
