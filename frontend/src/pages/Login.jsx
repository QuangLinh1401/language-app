import { useState } from "react";
import { api, auth } from "../api.js";
import Icon from "../components/Icon.jsx";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fn = mode === "login" ? api.auth.login : api.auth.register;
      const { token, username: name } = await fn(username.trim(), password);
      auth.save(token, name);
      onLogin(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-content" style={{ display: "flex", alignItems: "center", minHeight: "100dvh" }}>
        <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", padding: "24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img src="/cat.svg" alt="Cat playing" style={{ width: "100%", maxWidth: 260, marginBottom: 4 }} />
            <h1 className="page-title" style={{ fontSize: 22, marginBottom: 4 }}>Language App</h1>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              {mode === "login" ? "Welcome back! Log in to continue learning." : "Create an account to start your own learning path."}
            </div>
          </div>

          <form onSubmit={submit} className="card">
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Username
            </label>
            <input
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. linh_2001"
              autoComplete="username"
              autoFocus
            />

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, margin: "12px 0 4px" }}>
              Password
            </label>
            <input
              className="text-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />

            {error && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--bad-deep)", fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={busy || !username || !password}
              style={{ width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Icon name={mode === "login" ? "check" : "sparkle"} size={16} />
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: "var(--ink-soft)" }}>
            {mode === "login" ? (
              <>
                New here?{" "}
                <button className="link-btn" type="button" onClick={() => { setMode("register"); setError(""); }}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="link-btn" type="button" onClick={() => { setMode("login"); setError(""); }}>
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
