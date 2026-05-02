import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { saveSession } from "../utils/auth";

const initialRegisterForm = {
  name: "",
  email: "",
  password: "",
  role: "PROJECT_MANAGER"
};

const initialLoginForm = {
  email: "",
  password: ""
};

const roleOptions = [
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "EMPLOYEE", label: "Employee" }
];

export default function AuthPage({ theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/auth/signin" : "/auth/signup";
      const payload = mode === "login" ? loginForm : registerForm;
      const { data } = await api.post(endpoint, payload);
      saveSession(data);
      navigate("/");
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to complete the request");
    } finally {
      setLoading(false);
    }
  }

  const form = mode === "login" ? loginForm : registerForm;
  const setForm = mode === "login" ? setLoginForm : setRegisterForm;

  return (
    <div className="auth-shell">
      <button className="theme-toggle floating" onClick={onToggleTheme} type="button">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      <section className="hero-panel jira-hero">
        <p className="eyebrow">Software Team Workspace</p>
        <h1>Plan work, guide delivery, and keep every sprint visible.</h1>
        <p className="hero-copy">
          A Jira-inspired task manager for project managers, team leads, and employees with
          structured ownership, project visibility, and task-level progress tracking.
        </p>

        <div className="hero-grid">
          <div>
            <strong>Project Manager</strong>
            <span>Create projects, onboard teams, and control delivery scope.</span>
          </div>
          <div>
            <strong>Team Lead</strong>
            <span>Plan tasks, assign work, and track sprint execution.</span>
          </div>
          <div>
            <strong>Employee</strong>
            <span>Focus on assigned work, update status, and stay aligned.</span>
          </div>
          <div>
            <strong>Guided UX</strong>
            <span>Theme toggle, onboarding tour, and protected back navigation.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="switcher">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            Sign in
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            Join workspace
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <h2>{mode === "login" ? "Welcome back" : "Create your workspace account"}</h2>

          {mode === "register" && (
            <label>
              Full name
              <input
                value={form.name || ""}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Priya Sharma"
              />
            </label>
          )}

          <label>
            Work email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@company.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="minimum 6 characters"
            />
          </label>

          {mode === "register" && (
            <label>
              Role
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Enter workspace" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
