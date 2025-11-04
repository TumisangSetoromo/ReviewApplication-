import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils, FaFilm } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import backgroundImage from "../assets/img2.jpg";
import { auth } from "../firebase";

const API = "https://review-platform-backend-s1gq.onrender.com";

const Search = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("restaurant");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const qType = searchParams.get("type");
    if (qType === "movie" || qType === "restaurant") setType(qType);
  }, [searchParams]);

  // Body background
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

  const handleSearch = async () => {
    if (!query) return;
    try {
      const response = await axios.get(`${API}/api/search`, {
        params: {
          q: query,
          type,
          location: type === "restaurant" ? location || undefined : undefined,
        },
      });
      const data = response.data.results || response.data;
      setResults(data || []);
      setError("");
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.data?.error || err.message || "Unknown error");
      setResults([]);
    }
  };

  const openItem = async (item) => {
    const id = item.fsq_id || item.id || item.osm_id;
    if (!id) return alert("No id available for this item");
    const itemName = item.name || item.title || item.display_name || "";

    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.post(
          `${API}/api/users/track-search`,
          { itemId: id.toString(), itemName, itemType: type },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.warn("Failed to track search (not fatal):", err?.message || err);
      }
    }

    navigate(`/items/${encodeURIComponent(id)}?type=${encodeURIComponent(type)}&name=${encodeURIComponent(itemName)}`);
  };

  return (
    <div style={{
      maxWidth: "950px",
      margin: "2.5rem auto",
      padding: "1.5rem",
      background: "rgba(255,255,255,0.92)",
      borderRadius: "12px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      backdropFilter: "blur(6px)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem", color: "#222" }}>
        Search Movies or Restaurants
      </h2>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 40%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: 16 }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />

        {type === "restaurant" && (
          <input
            type="text"
            placeholder="Enter city (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ flex: "1 1 30%", padding: "0.65rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: 16 }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
        )}

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: 16 }}
        >
          <option value="restaurant">Restaurant</option>
          <option value="movie">Movie</option>
        </select>

        <button
          onClick={handleSearch}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0b76d1",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            transition: "background 0.18s"
          }}
        >
          Search
        </button>
      </div>

      {error && <p style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>Error: {error}</p>}

      {results.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#555" }}>Enter a movie or restaurant and click Search!</p>
      )}

      <div style={{ maxHeight: "480px", overflowY: "auto" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((item) => {
            const idKey = item.fsq_id || item.id || item.osm_id;
            return (
              <li
                key={idKey || Math.random()}
                role="button"
                tabIndex={0}
                onClick={() => openItem(item)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openItem(item); }}
                style={{
                  marginBottom: "0.6rem",
                  padding: "0.9rem",
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(254, 254, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {type === "restaurant" ? (
                  <FaUtensils style={{ color: "#16a34a", fontSize: 20 }} />
                ) : (
                  <FaFilm style={{ color: "#2563eb", fontSize: 20 }} />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#111" }}>{item.name || item.title}</div>
                  <div style={{ color: "#4b5563", fontSize: 13, marginTop: 4 }}>
                    {type === "restaurant" && item.location
                      ? `${item.location.address || item.location.display_name || ""}${item.location.city ? `, ${item.location.city}` : ""}`
                      : type === "movie" && item.release_date
                        ? `Release: ${item.release_date}`
                        : ""}
                  </div>
                </div>

                <div style={{ color: "#6b7280", fontSize: 13 }}>{type === "movie" ? "Movie" : "Restaurant"}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Search;