// src/pages/MyReviews.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
 

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      if (!auth.currentUser) {
        setReviews([]);
        setHistory([]);
        setLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`${API}/api/items/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews(response.data.reviews || []);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error("Fetch my reviews error:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch reviews");
      setReviews([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.delete(`${API}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("Delete review error:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete review");
    }
  };

  useEffect(() => {


    fetchReviews();
    // re-fetch on auth changes
    const unsub = auth.onAuthStateChanged(() => fetchReviews());
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  if (!auth.currentUser) {
    return (
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <p>Please log in to see your reviews and history.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "1.5rem auto", padding: "1rem" }}>
      <h2>My Reviews</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <section style={{ marginTop: 12 }}>
        <h3>Your posted reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid #ffffffff", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <strong>{r.itemName || r.itemId}</strong> — {r.itemType}
              <div>Rating: {r.rating}</div>
              <div>Comment: {r.comment}</div>
              {r.createdAt && <small style={{ color: "#ffffffff" }}>Posted: {new Date(r.createdAt).toLocaleString()}</small>}
              <div style={{ marginTop: 8 }}>
                <button onClick={() => handleDelete(r.id)} style={{ padding: "6px 10px", background: "#ff4d4f", color: "#fff", border: "none", borderRadius: 6 }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Recent searches (history)</h3>
        {history.length === 0 ? (
          <p>No recent searches recorded.</p>
        ) : (
          history.map((h) => (
            <div key={h.id} style={{ border: "1px dashed #eee", padding: 10, marginBottom: 8 }}>
              <strong>{h.itemName || h.itemId}</strong> — {h.itemType}
              {h.createdAt && <div style={{ color: "#fffbfbff", fontSize: 13 }}>Seen: {new Date(h.createdAt).toLocaleString()}</div>}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
