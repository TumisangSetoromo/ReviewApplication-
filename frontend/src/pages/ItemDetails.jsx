import React, { useEffect, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  // ------------------- Load reviews -------------------
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    
    try {
      setReviewsLoading(true);
      setError(null);
      console.log("🔄 Fetching reviews for item:", id);
      
      const response = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
      console.log("✅ Reviews fetched successfully:", response.data.length, "reviews");
      setReviews(response.data || []);
    } catch (err) {
      console.error("❌ Reviews load error", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || "Failed to load reviews";
      setError(errorMessage);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  // ------------------- Load item details -------------------
  const fetchItemDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      console.log("🔄 Fetching item details for:", id);
      
      const response = await axios.get(`${API}/api/items/${encodeURIComponent(id)}?type=${type}`);
      setItem(response.data);
      console.log("✅ Item details fetched successfully");
    } catch (err) {
      console.error("❌ Item load error:", err);
      if (nameFromQuery) {
        setItem({ name: nameFromQuery, title: nameFromQuery });
      } else {
        setError("Failed to load item details");
      }
    } finally {
      setLoading(false);
    }
  }, [id, type, nameFromQuery]);

  useEffect(() => {
    const loadData = async () => {
      await fetchItemDetails();
      await fetchReviews();
    };

    if (id) {
      loadData();
    }
  }, [id, fetchItemDetails, fetchReviews]);

  // ------------------- Create review -------------------
  async function createReview() {
    if (!user) {
      alert("Please login to post a review");
      return;
    }
    try {
      const token = await user.getIdToken();
      const itemName = item?.title || item?.name || nameFromQuery || "";
      const body = { rating: Number(rating), comment, itemType: type, itemName };
      
      console.log("📝 Creating review...");
      await axios.post(`${API}/api/items/${encodeURIComponent(id)}/reviews`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComment("");
      setRating(5);
      console.log("✅ Review created successfully");
      fetchReviews(); // Refresh reviews
    } catch (err) {
      console.error("❌ Create review error:", err);
      alert(err.response?.data?.error || "Failed to post review");
    }
  }

  // ------------------- Edit review -------------------
  function startEditing(review) {
    setEditingReviewId(review.id);
    setEditingRating(review.rating);
    setEditingComment(review.comment);
  }

  function cancelEditing() {
    setEditingReviewId(null);
    setEditingRating(5);
    setEditingComment("");
  }

  async function updateReview(reviewId) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      console.log("✏️ Updating review:", reviewId);
      
      await axios.put(
        `${API}/api/items/reviews/${reviewId}`, 
        { rating: Number(editingRating), comment: editingComment }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      cancelEditing();
      console.log("✅ Review updated successfully");
      fetchReviews();
    } catch (err) {
      console.error("❌ Update review error:", err);
      alert(err.response?.data?.error || "Failed to update review");
    }
  }

  // ------------------- Delete review -------------------
  async function deleteReview(reviewId) {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = await user.getIdToken();
      console.log("🗑️ Deleting review:", reviewId);
      
      await axios.delete(`${API}/api/items/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Review deleted successfully");
      fetchReviews();
    } catch (err) {
      console.error("❌ Delete review error:", err);
      alert(err.response?.data?.error || "Failed to delete review");
    }
  }

  // ------------------- Star component -------------------
  const Star = ({ filled, onClick }) => (
    <span
      onClick={onClick}
      style={{
        cursor: "pointer",
        color: filled ? "#ffc107" : "#e4e5e9",
        fontSize: 24,
        marginRight: 2,
      }}
    >
      ★
    </span>
  );

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading item details...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: "1rem", 
          marginBottom: "1rem", 
          borderRadius: "4px",
          border: "1px solid #f44336"
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchReviews}
            style={{ 
              marginLeft: "1rem", 
              padding: "4px 8px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {item ? (
        <>
          <h2>{item.title || item.name || nameFromQuery}</h2>
          {type === "movie" && item.poster_path && (
            <img 
              src={`https://image.tmdb.org/t/p/w300${item.poster_path}`} 
              alt={item.title} 
              style={{ marginBottom: "1rem", borderRadius: "8px" }}
            />
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
      <h4>Reviews {reviewsLoading && "(Loading...)"}</h4>
      
      {reviewsLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 10, borderRadius: "4px" }}>
            <strong>{r.username || "Anonymous"}</strong> — {r.rating}/5
            {editingReviewId === r.id ? (
              <>
                <div style={{ margin: "6px 0" }}>
                  {[1,2,3,4,5].map((n) => (
                    <Star
                      key={n}
                      filled={editingRating >= n}
                      onClick={() => setEditingRating(n)}
                    />
                  ))}
                  <textarea 
                    rows={2} 
                    value={editingComment} 
                    onChange={(e) => setEditingComment(e.target.value)} 
                    style={{ width: "100%", marginTop: 4, padding: "8px" }} 
                    placeholder="Enter your review comment..."
                  />
                </div>
                <button 
                  onClick={() => updateReview(r.id)} 
                  style={{ marginRight: 6, padding: "6px 12px" }}
                >
                  Save
                </button>
                <button 
                  onClick={cancelEditing}
                  style={{ padding: "6px 12px" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p style={{ marginTop: 6, marginBottom: 6 }}>{r.comment}</p>
                {user && r.userId === user.uid && (
                  <div>
                    <button 
                      onClick={() => startEditing(r)} 
                      style={{ 
                        marginRight: 6, 
                        padding: "4px 8px",
                        background: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteReview(r.id)}
                      style={{ 
                        padding: "4px 8px", 
                        background: "#f44336", 
                        color: "white", 
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
            {r.createdAt && (
              <small style={{ color: "#706e6eff", display: "block", marginTop: "8px" }}>
                Posted: {new Date(r.createdAt).toLocaleString()}
              </small>
            )}
          </div>
        ))
      )}

      <hr />
      <h5>Add a review</h5>
      {user ? (
        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Rating</label>
            <div>
              {[1,2,3,4,5].map((n) => (
                <Star key={n} filled={rating >= n} onClick={() => setRating(n)} />
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Comment</label>
            <textarea 
              rows={3} 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              style={{ width: "100%", padding: 8 }} 
              placeholder="Share your thoughts about this item..."
            />
          </div>
          <button 
            onClick={createReview} 
            style={{ 
              padding: "8px 14px", 
              background: "#0b76d1", 
              color: "#fff", 
              border: "none", 
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            Post review
          </button>
        </div>
      ) : (
        <p>Please log in to post a review.</p>
      )}
    </div>
  );
}