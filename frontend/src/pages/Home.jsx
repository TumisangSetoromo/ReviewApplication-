import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/img2.jpg";
import axios from "axios";

const API = "https://review-platform-backend-s1gq.onrender.com";

export default function Home() {
  const navigate = useNavigate();
  const [homeMovies, setHomeMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundImage})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.margin = 0;

    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "white";
    };
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/home-movies`);
        setHomeMovies(res.data.movies || []);
      } catch (err) {
        console.error("Failed to fetch home movies:", err.response?.data || err.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const openMovie = (movie) => {
    navigate(`/items/${movie.id}?type=movie&name=${encodeURIComponent(movie.title)}`);
  };

  const renderStars = (vote) => {
    const stars = Math.round(vote / 2);
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem", color: "#fff", zIndex: 1 }}>
        <h1 style={{ fontSize: "2.5rem", textShadow: "2px 2px 6px rgba(0,0,0,0.7)" }}>Welcome to ReviewHub</h1>
        <p style={{ fontSize: "1.2rem", textShadow: "1px 1px 4px rgba(0,0,0,0.6)" }}>
          Discover popular, trending, and new movies before you search!
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#fff", textAlign: "center" }}>Loading movies...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {homeMovies.map((m) => (
            <div
              key={m.id}
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "#fff",
                textAlign: "center",
                padding: 8,
              }}
              onClick={() => openMovie(m)}
            >
              <img
                src={m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : ""}
                alt={m.title}
                style={{ width: "100%", borderRadius: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <strong>{m.title}</strong>
                <div style={{ fontSize: 14 }}>Rating: {m.avgRating.toFixed(1)} ({m.reviews?.length || 0})</div>
                <div style={{ color: "#ffcc00", fontSize: 14 }}>{renderStars(m.avgRating)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}