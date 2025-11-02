import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import ItemDetails from "./pages/ItemDetails";
import MyReviews from "./pages/MyReviews";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { auth } from "./firebase";

// Navigation bar component
function Nav({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/"); // go to home after logout
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        background: "linear-gradient(90deg,#0d6efd,#0b5ed7)",
        color: "#fff",
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(17, 17, 18, 0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link
          to="/"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          🎬 ReviewHub
        </Link>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {/* ✅ Added Home button here */}
        <Link to="/" style={linkStyle}>
          Home
        </Link>

        <Link to="/search" style={linkStyle}>
          Search
        </Link>

        {user && (
          <Link to="/my-reviews" style={linkStyle}>
            My Reviews
          </Link>
        )}

        {!user && (
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
        )}
        {!user && (
          <Link to="/register" style={linkStyle}>
            Register
          </Link>
        )}

        {user && (
          <button
            onClick={handleLogout}
            style={{
              ...logoutBtnStyle,
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
            title="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

// Shared link/button styles
const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  padding: "6px 8px",
  borderRadius: 6,
  transition: "background .18s",
};
const logoutBtnStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
};

// Main App
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      {/* Fixed navigation bar */}
      <Nav user={user} />

      {/* Push page content down so it’s not hidden under navbar */}
      <div
        style={{
          paddingTop: 84,
          minHeight: "80vh",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/items/:id" element={<ItemDetails />} />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          color: "#444",
          borderTop: "1px solid #e9ecef",
          marginTop: 24,
        }}
      >
        &copy; {new Date().getFullYear()} ReviewHub — Movie & Restaurant Reviews
      </footer>
    </BrowserRouter>
  );
}
