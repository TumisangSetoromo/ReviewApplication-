// src/pages/Login.jsx
import React, { useEffect,useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/img2.jpg"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // body background
    useEffect(() => {
      const prev = {
        backgroundImage: document.body.style.backgroundImage,
        backgroundSize: document.body.style.backgroundSize,
        backgroundPosition: document.body.style.backgroundPosition,
        backgroundRepeat: document.body.style.backgroundRepeat,
      };
      document.body.style.backgroundImage = `url(${backgroundImage})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
      return () => {
        document.body.style.backgroundImage = prev.backgroundImage || "";
        document.body.style.backgroundSize = prev.backgroundSize || "";
        document.body.style.backgroundPosition = prev.backgroundPosition || "";
        document.body.style.backgroundRepeat = prev.backgroundRepeat || "";
      };
    }, []);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in:", userCred.user);
      navigate("/"); // redirect home on success
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: 420,
      padding: "2rem",
      borderRadius: 12,
      background: "linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)",
      boxShadow: "0 6px 20px rgba(16,24,40,0.12)",
      border: "1px solid rgba(16,24,40,0.04)",
    },
    title: {
      margin: 0,
      marginBottom: "1rem",
      fontSize: "1.5rem",
      color: "#0f172a",
      textAlign: "center",
    },
    input: {
      width: "100%",
      padding: "0.65rem 0.75rem",
      marginBottom: "0.75rem",
      borderRadius: 8,
      border: "1px solid #e6edf3",
      outline: "none",
      fontSize: "0.95rem",
    },
    row: { display: "flex", gap: "0.5rem", alignItems: "center" },
    button: {
      width: "100%",
      padding: "0.65rem",
      borderRadius: 8,
      border: "none",
      background: "#2563eb",
      color: "white",
      fontWeight: 600,
      cursor: "pointer",
      fontSize: "1rem",
    },
    link: {
      color: "#2563eb",
      cursor: "pointer",
      textDecoration: "underline",
      fontSize: "0.9rem",
    },
    footer: {
      marginTop: "1rem",
      textAlign: "center",
      color: "#475569",
      fontSize: "0.9rem",
    },
    error: {
      color: "#b91c1c",
      background: "#fff1f2",
      padding: "0.5rem 0.75rem",
      borderRadius: 8,
      marginBottom: "0.75rem",
      border: "1px solid rgba(185,28,28,0.08)",
    },
    pwdToggle: {
      marginLeft: "auto",
      cursor: "pointer",
      background: "transparent",
      border: "none",
      color: "#334155",
      fontSize: "0.85rem",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome back</h2>

        {error && <div style={styles.error}>Error: {error}</div>}

        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />

          <div style={{ position: "relative" }}>
            <input
              style={{ ...styles.input, paddingRight: 90 }}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                padding: "0.4rem 0.6rem",
                borderRadius: 8,
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
                color: "#0f172a",
                fontSize: "0.85rem",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#475569", fontSize: "0.9rem" }}>
              <input type="checkbox" /> Remember me
            </label>
            <span style={styles.link} onClick={() => navigate("/register")}>Create account</span>
          </div>

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={styles.footer}>
          <small>By signing in you agree to the project demo terms.</small>
        </div>
      </div>
    </div>
  );
}
