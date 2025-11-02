import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";


const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ItemDetails() {
  const { id } = useParams();
  const query = useQuery();
  const type = query.get("type") || "movie";
  const nameFromQuery = query.get("name") || "";

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  // Load item & reviews
  useEffect(() => {
    const load = async () => {
      try {
        const r = await axios.get(`${API}/api/items/${encodeURIComponent(id)}?type=${type}`);
        setItem(r.data);
      } catch {
        if (nameFromQuery) setItem({ name: nameFromQuery, title: nameFromQuery });
        else alert("Failed to load item");
      }

      try {
        const rr = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
        setReviews(rr.data || []);
      } catch (err) {
        console.error("Reviews load error", err);
      }
    };
    load();
  }, [id, type, nameFromQuery]);


  // Create review
  async function createReview() {
    if (!user) {
      alert("Please login to post a review");
      return;
    }
    try {
      const token = await user.getIdToken();
      const itemName = item?.title || item?.name || nameFromQuery || "";
      const body = { rating: Number(rating), comment, itemType: type, itemName };
      await axios.post(`${API}/api/items/${encodeURIComponent(id)}/reviews`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Review posted");
      const rr = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
      setReviews(rr.data || []);
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to post review");
    }
  }

  // Start editing a review
  function startEditing(review) {
    setEditingReviewId(review.id);
    setEditingRating(review.rating);
    setEditingComment(review.comment);
  }

  // Cancel editing
  function cancelEditing() {
    setEditingReviewId(null);
    setEditingRating(5);
    setEditingComment("");
  }

  // Update review
  async function updateReview(reviewId) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await axios.put(`${API}/api/reviews/${reviewId}`, { rating: Number(editingRating), comment: editingComment }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rr = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
      setReviews(rr.data || []);
      cancelEditing();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update review");
    }
  }

  // Delete review
  async function deleteReview(reviewId) {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = await user.getIdToken();
      await axios.delete(`${API}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rr = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
      setReviews(rr.data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete review");
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      {item ? (
        <>
          <h2>{item.title || item.name || nameFromQuery}</h2>
          {type === "movie" && item.poster_path && (
            <img src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} alt={item.title} className="mb-3" />
          )}
          {type === "restaurant" && (
            <p><strong>Address:</strong> {item.location?.formatted_address || item.location?.address || item.location?.display_name || ""}</p>
          )}
          <p>{item.overview || item.description || item?.location?.address || ""}</p>
        </>
      ) : (
        <p>Loading item...</p>
      )}

      <hr />
      <h4>Reviews</h4>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 10 }}>
            <strong>{r.username || "Anonymous"}</strong> — {r.rating}/5
            {editingReviewId === r.id ? (
              <>
                <div style={{ margin: "6px 0" }}>
                  <select value={editingRating} onChange={(e) => setEditingRating(e.target.value)}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <textarea rows={2} value={editingComment} onChange={(e) => setEditingComment(e.target.value)} style={{ width: "100%", marginTop: 4 }} />
                </div>
                <button onClick={() => updateReview(r.id)} style={{ marginRight: 6 }}>Save</button>
                <button onClick={cancelEditing}>Cancel</button>
              </>
            ) : (
              <>
                <p style={{ marginTop: 6 }}>{r.comment}</p>
                {user && r.userId === user.uid && (
                  <div>
                    <button onClick={() => startEditing(r)} style={{ marginRight: 6 }}>Edit</button>
                    <button onClick={() => deleteReview(r.id)}>Delete</button>
                  </div>
                )}
              </>
            )}
            {r.createdAt && <small style={{ color: "#706e6eff" }}>Posted: {new Date(r.createdAt).toLocaleString()}</small>}
          </div>
        ))
      )}

      <hr />
      <h5>Add a review</h5>
      <div style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ width: "100%", padding: 8 }}>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Comment</label>
          <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <button onClick={createReview} style={{ padding: "8px 14px", background: "#0b76d1", color: "#fff", border: "none", borderRadius: 6 }}>
          Post review
        </button>
      </div>
    </div>
  );
}
