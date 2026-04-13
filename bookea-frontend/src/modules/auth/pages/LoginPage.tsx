import { useState } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { authService } from "../services";
import { useAuth } from "../context/AuthContext";

type View = "login" | "forgot";

function resolveSafeInternalPath(fromState: string | undefined, fromQuery: string | null): string | null {
  const raw = fromState ?? fromQuery ?? null;
  if (!raw) return null;
  const decoded = decodeURIComponent(raw.trim());
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const registered = (location.state as { registered?: boolean })?.registered;

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await authService.login({ username: email, password });
      await checkAuth();
      const stateFrom = (location.state as { from?: string } | null)?.from;
      const queryFrom = searchParams.get("from");
      const target = resolveSafeInternalPath(stateFrom, queryFrom) ?? "/profile";
      navigate(target, { replace: true });
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSuccess("Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F5F0", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ fontSize: 24, fontWeight: 600, color: "#E8520A", textDecoration: "none" }}>Bookea</Link>
        </div>

        <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "2rem" }}>

          {/* ── LOGIN ───────────────────────────────── */}
          {view === "login" && (
            <>
              <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.5rem", textAlign: "center", color: "#111" }}>
                Connexion
              </h1>

              {registered && (
                <div style={{ background: "#EAF3DE", color: "#3B6D11", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
                  Compte créé avec succès ! Vous pouvez vous connecter.
                </div>
              )}

              {error && (
                <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email <span style={{ color: "#E8520A" }}>*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@exemple.com"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#E8520A"}
                    onBlur={e => e.target.style.borderColor = "#ddd"}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>Mot de passe <span style={{ color: "#E8520A" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ ...inputStyle, paddingRight: 80 }}
                      onFocus={e => e.target.style.borderColor = "#E8520A"}
                      onBlur={e => e.target.style.borderColor = "#ddd"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: 12 }}
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setError(null); }}
                    style={{ background: "none", border: "none", color: "#E8520A", fontSize: 13, cursor: "pointer", padding: 0 }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} style={btnStyle(isLoading)}>
                  {isLoading ? "Connexion…" : "Se connecter"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: "1.25rem" }}>
                Pas encore de compte ?{" "}
                <Link to="/register" style={{ color: "#E8520A", textDecoration: "none", fontWeight: 500 }}>
                  S'inscrire
                </Link>
              </p>
            </>
          )}

          {/* ── FORGOT ──────────────────────────────── */}
          {view === "forgot" && (
            <>
              <button
                type="button"
                onClick={() => { setView("login"); setError(null); setSuccess(null); }}
                style={{ background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: "1rem" }}
              >
                ← Retour
              </button>

              <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, textAlign: "center", color: "#111" }}>
                Mot de passe oublié
              </h1>
              <p style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: "1.5rem" }}>
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
                  {error}
                </div>
              )}

              {success ? (
                <div style={{ background: "#EAF3DE", color: "#3B6D11", padding: "14px", borderRadius: 8, fontSize: 13, textAlign: "center" }}>
                  {success}
                </div>
              ) : (
                <form onSubmit={handleForgot} noValidate>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={labelStyle}>Adresse email <span style={{ color: "#E8520A" }}>*</span></label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="john@exemple.com"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#E8520A"}
                      onBlur={e => e.target.style.borderColor = "#ddd"}
                    />
                  </div>
                  <button type="submit" disabled={isLoading} style={btnStyle(isLoading)}>
                    {isLoading ? "Envoi…" : "Envoyer le lien"}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 10px",
  border: "0.5px solid #ddd", borderRadius: 8,
  fontSize: 14, outline: "none", transition: "border-color .2s",
  boxSizing: "border-box", color: "#222"
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%", height: 40,
  background: disabled ? "#ccc" : "#E8520A",
  color: "#fff", border: "none", borderRadius: 8,
  fontSize: 14, fontWeight: 500,
  cursor: disabled ? "not-allowed" : "pointer"
});