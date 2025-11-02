// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered:", userCred.user);
      alert("Registration successful — please log in");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "'Inter', system-ui, Arial, sans-serif",
      background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)",
    },
    panel: {
      width: "100%",
      maxWidth: 520,
      padding: "2rem",
      borderRadius: 12,
      background: "white",
      boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
      border: "1px solid rgba(15,23,42,0.04)",
    },
    header: {
      marginBottom: "1rem",
      color: "#06283D",
      fontSize: "1.4rem",
      textAlign: "center",
    },
    input: {
      width: "100%",
      padding: "0.72rem",
      marginBottom: "0.75rem",
      borderRadius: 10,
      border: "1px solid #e6edf3",
      fontSize: "0.95rem",
    },
    button: {
      width: "100%",
      padding: "0.7rem",
      borderRadius: 10,
      border: "none",
      background: "#0ea5a4",
      color: "white",
      fontSize: "1rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    smallLink: {
      marginTop: "0.75rem",
      textAlign: "center",
      color: "#0ea5a4",
      cursor: "pointer",
    },
    error: {
      padding: "0.5rem",
      background: "#fff6f6",
      color: "#9b1c1c",
      borderRadius: 8,
      marginBottom: 12,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <h3 style={styles.header}>Create an account</h3>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div style={styles.smallLink} onClick={() => navigate("/login")}>
          Already have an account? Log in
        </div>
      </div>
    </div>
  );
}
