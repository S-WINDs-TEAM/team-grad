import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { theme } from "../styles/theme";

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // await login(data);
      const response = await login(data);
      const role = response.data.user.role;

      // route each role to its own landing page — company_admin manages the fleet,
      // company_driver shares live location, individual plans personal trips
      if (role === "company_admin") navigate("/fleet");
      else if (role === "company_driver") navigate("/fleet-driver");
      else navigate("/home");
    } catch (err) {
      // BUG FIX: mirror the RegisterPage fix — when err.response is
      // undefined the server wasn't reachable (not a credentials problem).
      // Surface the real reason instead of always saying "Login failed".
      console.error(
        "login failed — status:",
        err.response?.status,
        "| message:",
        err.message,
        "| code:",
        err.code,
      );
      if (!err.response) {
        alert(
          "Cannot reach the server — is it running on :5000 with MongoDB up?",
        );
      } else {
        alert(err.response?.data?.msg || "Login failed");
      }
    }
  };

  return (
    <div style={styles.page}>
      {/* ===== يسار: atmospheric panel ===== */}
      <div style={styles.leftPanel}>
        <div style={styles.leftGlow} />

        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
        </div>

        {/* Hero text */}
        <div style={styles.leftContent}>
          <h1 style={styles.leftTitle}>
            Drive Smart.
            <br />
            <span style={{ color: theme.accentBlue }}>Stay Ahead.</span>
          </h1>
          <p style={styles.leftSub}>
            Real-time weather intelligence for every journey.
          </p>

          {/* Feature badges */}
          <div style={styles.featuresList}>
            {[
              { icon: "🌦", text: "ETA-Based Weather Forecast" },
              { icon: "🗺", text: "Smart Route Recommendations" },
              { icon: "🛡", text: "Per-Waypoint Risk Analysis" },
              { icon: "⚡", text: "Geospatial Caching Engine" },
            ].map((f) => (
              <div key={f.text} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom road visual */}
        <div style={styles.roadVisual}>
          <svg
            width="100%"
            height="80"
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 80 Q 200 20 400 40"
              stroke="rgba(37,99,235,0.3)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 0 80 Q 200 30 400 50"
              stroke="rgba(37,99,235,0.15)"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="120" cy="58" r="3" fill="#2563EB" opacity="0.6" />
            <circle cx="250" cy="35" r="3" fill="#10B981" opacity="0.6" />
            <circle cx="350" cy="45" r="3" fill="#F59E0B" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* ===== يمين: login form ===== */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Login to continue your journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✉</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && (
                <span style={styles.error}>{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
              </div>
              {errors.password && (
                <span style={styles.error}>{errors.password.message}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? "Logging in..." : "Log In →"}
            </button>
          </form>

          <p style={styles.switchText}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.link}>
              Create one
            </Link>
          </p>

          {/* BUG FIX: the element had TWO `style` props on the same <p>.
              React ignores the second one, so marginTop:'8px' was silently lost.
              Merged both into a single style object. */}
          <p style={{ ...styles.switchText, marginTop: "8px" }}>
            <Link
              to="/"
              style={{
                ...styles.link,
                color: theme.textMuted,
                fontSize: "12px",
              }}
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#080C14",
    fontFamily: "system-ui, sans-serif",
  },

  // ===== Left Panel =====
  leftPanel: {
    background: "linear-gradient(160deg, #0D1321 0%, #080C14 100%)",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },
  leftGlow: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "70%",
    height: "70%",
    background:
      "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "auto",
    position: "relative",
    zIndex: 1,
  },
  logoIcon: { fontSize: "22px", color: "#2563EB" },
  logoText: { fontSize: "20px", fontWeight: "700", color: "#fff" },
  leftContent: {
    position: "relative",
    zIndex: 1,
    marginBottom: "32px",
  },
  leftTitle: {
    fontSize: "38px",
    fontWeight: "800",
    color: "#fff",
    lineHeight: 1.2,
    margin: "0 0 16px",
  },
  leftSub: {
    fontSize: "15px",
    color: "#64748B",
    margin: "0 0 32px",
  },
  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "12px 16px",
  },
  featureIcon: { fontSize: "18px" },
  featureText: { fontSize: "13px", color: "#94A3B8" },
  roadVisual: { position: "relative", zIndex: 1 },

  // ===== Right Panel =====
  rightPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },
  formCard: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(13,19,33,0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "40px",
    backdropFilter: "blur(20px)",
  },
  formHeader: { marginBottom: "32px" },
  formTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
  },
  formSub: { fontSize: "14px", color: "#64748B", margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "500", color: "#94A3B8" },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "14px",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "13px 14px 13px 40px",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  error: { fontSize: "12px", color: "#EF4444" },
  submitBtn: {
    padding: "14px",
    background: "#2563EB",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "opacity 0.2s",
  },
  switchText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#64748B",
    marginTop: "24px",
  },
  link: { color: "#2563EB", textDecoration: "none", fontWeight: "500" },
};

export default LoginPage;
