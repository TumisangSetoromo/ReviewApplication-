import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/img2.jpg"; // ✅ local image

export default function Home() {
  const navigate = useNavigate();

  // ✅ Apply background to the body itself (not just container)
  useEffect(() => {
    // set background for the whole page
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed"; // makes it stay still while scrolling
    document.body.style.margin = 0;

    // cleanup when leaving the page
    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "white"; // restore default
    };
  }, []);

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 0,
    },
    content: {
      position: "relative",
      zIndex: 1,
      color: "#fff",
      textAlign: "center",
      minHeight: "10vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
    },
    title: {
      fontSize: "3rem",
      fontWeight: 800,
      marginBottom: "1rem",
      textShadow: "0px 4px 8px rgba(0,0,0,0.5)",
    },
    subtitle: {
      fontSize: "1.3rem",
      marginBottom: "2rem",
      color: "#e2e8f0",
      lineHeight: 1.6,
      textShadow: "0px 2px 4px rgba(0,0,0,0.3)",
      maxWidth: "700px",
    },
    btnGroup: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    btn: {
      padding: "0.9rem 1.8rem",
      border: "none",
      borderRadius: "30px",
      fontSize: "1rem",
      cursor: "pointer",
      background: "linear-gradient(135deg, #2563eb, #38bdf8)",
      color: "white",
      fontWeight: "600",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      boxShadow: "0px 3px 6px rgba(0,0,0,0.3)",
    },
    btnAlt: {
      background: "linear-gradient(135deg, #0ea5a4, #14b8a6)",
    },
  };

  return (
    <>
      <div style={styles.overlay}></div>

      <div style={styles.content}>
        <h1 style={styles.title}>Welcome to ReviewHub</h1>
        <p style={styles.subtitle}>
          Discover and share your thoughts on movies and restaurants around the world.
        </p>

        <div style={styles.btnGroup}>
          <button
            style={styles.btn}
            onClick={() => navigate("/search?type=movie")}
          >
            🎬 Explore Movies
          </button>

          <button
            style={{ ...styles.btn, ...styles.btnAlt }}
            onClick={() => navigate("/search?type=restaurant")}
          >
            🍴 Explore Restaurants
          </button>
        </div>
      </div>
    </>
  );
}
