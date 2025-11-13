import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";

const API = "https://review-platform-backend-s1gq.onrender.com";

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

  // CSS Styles
  const styles = {
    container: {
      maxWidth: "900px",
      margin: "2rem auto",
      padding: "2rem",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      borderRadius: "20px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    header: {
      background: "linear-gradient(135deg, #667eea 0%, #090909ff 100%)",
      color: "white",
      padding: "2rem",
      borderRadius: "16px",
      marginBottom: "2rem",
      textAlign: "center",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "700",
      marginBottom: "0.5rem",
      textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    },
    subtitle: {
      fontSize: "1.1rem",
      opacity: "0.9",
      fontWeight: "300",
    },
    content: {
      background: "white",
      padding: "2rem",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      marginBottom: "2rem",
    },
    poster: {
      width: "100%",
      maxWidth: "300px",
      borderRadius: "12px",
      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
      marginBottom: "1.5rem",
    },
    section: {
      background: "white",
      padding: "2rem",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      marginBottom: "2rem",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#07080aff",
      marginBottom: "1.5rem",
      borderBottom: "3px solid #1b1d26ff",
      paddingBottom: "0.5rem",
    },
    reviewCard: {
      background: "linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "1rem",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    reviewCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    },
    username: {
      fontWeight: "600",
      color: "#2d3748",
      fontSize: "1.1rem",
    },
    rating: {
      color: "#f6ad55",
      fontWeight: "600",
      fontSize: "1rem",
    },
    comment: {
      color: "#4a5568",
      lineHeight: "1.6",
      margin: "0.75rem 0",
      fontStyle: "italic",
    },
    timestamp: {
      color: "#718096",
      fontSize: "0.85rem",
      fontStyle: "italic",
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "10px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "0.9rem",
    },
    buttonPrimary: {
      background: "linear-gradient(135deg, #667eea 0%, #070707ff 100%)",
      color: "white",
    },
    buttonSecondary: {
      background: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
      color: "white",
    },
    buttonDanger: {
      background: "linear-gradient(135deg, #fc8181 0%, #f56565 100%)",
      color: "white",
    },
    formContainer: {
      background: "linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)",
      padding: "2rem",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    },
    input: {
      width: "100%",
      padding: "1rem",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "1rem",
      transition: "all 0.3s ease",
      marginBottom: "1rem",
    },
    inputFocus: {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
    },
    textarea: {
      width: "100%",
      padding: "1rem",
      border: "2px solid #e2e8f0",
      borderRadius: "10px",
      fontSize: "1rem",
      minHeight: "120px",
      resize: "vertical",
      transition: "all 0.3s ease",
      marginBottom: "1rem",
    },
    starContainer: {
      display: "flex",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
    star: {
      cursor: "pointer",
      fontSize: "2rem",
      transition: "all 0.2s ease",
    },
    error: {
      background: "linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)",
      color: "#c53030",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      marginBottom: "1.5rem",
      border: "1px solid #feb2b2",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    loading: {
      textAlign: "center",
      padding: "3rem",
      color: "#718096",
      fontSize: "1.1rem",
    },
    actionButtons: {
      display: "flex",
      gap: "0.5rem",
      marginTop: "1rem",
    },
  };

  // ------------------- Load reviews -------------------
  const fetchReviews = useCallback(async () => {
    if (!id) return;
    
    try {
      setReviewsLoading(true);
      setError(null);
      const response = await axios.get(`${API}/api/items/${encodeURIComponent(id)}/reviews`);
      setReviews(response.data || []);
    } catch (err) {
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
      const response = await axios.get(`${API}/api/items/${encodeURIComponent(id)}?type=${type}`);
      setItem(response.data);
    } catch (err) {
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
      
      await axios.post(`${API}/api/items/${encodeURIComponent(id)}/reviews`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComment("");
      setRating(5);
      fetchReviews();
    } catch (err) {
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
      await axios.put(
        `${API}/api/items/reviews/${reviewId}`, 
        { rating: Number(editingRating), comment: editingComment }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cancelEditing();
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update review");
    }
  }

  // ------------------- Delete review -------------------
  async function deleteReview(reviewId) {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const token = await user.getIdToken();
      await axios.delete(`${API}/api/items/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete review");
    }
  }

  // ------------------- Star component -------------------
  const Star = ({ filled, onClick, size = "2rem" }) => (
    <span
      onClick={onClick}
      style={{
        ...styles.star,
        color: filled ? "#ffd700" : "#e2e8f0",
        fontSize: size,
        textShadow: filled ? "0 2px 8px rgba(255, 215, 0, 0.4)" : "none",
      }}
    >
      ★
    </span>
  );

  if (loading) {
    return <div style={styles.loading}>Loading item details...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Error Display */}
      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
          <button 
            onClick={fetchReviews}
            style={{ ...styles.button, ...styles.buttonSecondary }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Item Header */}
      {item && (
        <div style={styles.header}>
          <h1 style={styles.title}>{item.title || item.name || nameFromQuery}</h1>
          {type === "movie" && item.release_date && (
            <p style={styles.subtitle}>Released: {new Date(item.release_date).getFullYear()}</p>
          )}
        </div>
      )}

      {/* Item Content */}
      {item && (
        <div style={styles.content}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {type === "movie" && item.poster_path && (
              <img 
                src={`https://image.tmdb.org/t/p/w400${item.poster_path}`} 
                alt={item.title} 
                style={styles.poster}
              />
            )}
            <div style={{ flex: 1, minWidth: "300px" }}>
              {type === "restaurant" && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ color: "#2d3748", marginBottom: "0.5rem" }}>📍 Address</h3>
                  <p style={{ color: "#4a5568", lineHeight: "1.6" }}>
                    {item.location?.formatted_address || item.location?.address || item.location?.display_name || "Address not available"}
                  </p>
                </div>
              )}
              {item.overview && (
                <div>
                  <h3 style={{ color: "#2d3748", marginBottom: "0.5rem" }}>📖 Overview</h3>
                  <p style={{ color: "#4a5568", lineHeight: "1.8" }}>{item.overview}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Reviews {reviewsLoading && "⏳"}
        </h2>
        
        {reviewsLoading ? (
          <div style={styles.loading}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>No reviews yet</p>
            <p>Be the first to share your thoughts about this {type}!</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div 
              key={r.id} 
              style={styles.reviewCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = styles.reviewCardHover.transform;
                e.currentTarget.style.boxShadow = styles.reviewCardHover.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = styles.reviewCard.boxShadow;
              }}
            >
              {editingReviewId === r.id ? (
                <>
                  <div style={styles.starContainer}>
                    {[1,2,3,4,5].map((n) => (
                      <Star
                        key={n}
                        filled={editingRating >= n}
                        onClick={() => setEditingRating(n)}
                      />
                    ))}
                  </div>
                  <textarea 
                    rows={3}
                    value={editingComment} 
                    onChange={(e) => setEditingComment(e.target.value)} 
                    style={styles.textarea}
                    placeholder="Share your thoughts..."
                  />
                  <div style={styles.actionButtons}>
                    <button 
                      onClick={() => updateReview(r.id)} 
                      style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                      💾 Save
                    </button>
                    <button 
                      onClick={cancelEditing}
                      style={{ ...styles.button, background: "#a0aec0", color: "white" }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <span style={styles.username}>{r.username || "Anonymous"}</span>
                      <span style={{ ...styles.rating, marginLeft: "1rem" }}>
                        {r.rating}/5
                      </span>
                    </div>
                    {user && r.userId === user.uid && (
                      <div style={styles.actionButtons}>
                        <button 
                          onClick={() => startEditing(r)} 
                          style={{ ...styles.button, ...styles.buttonSecondary, padding: "0.5rem 1rem" }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => deleteReview(r.id)}
                          style={{ ...styles.button, ...styles.buttonDanger, padding: "0.5rem 1rem" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {r.comment && (
                    <p style={styles.comment}>"{r.comment}"</p>
                  )}
                  
                  {r.createdAt && (
                    <p style={styles.timestamp}>
                      📅 Posted: {new Date(r.createdAt).toLocaleString()}
                    </p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Review Section */}
      <div style={styles.formContainer}>
        <h2 style={styles.sectionTitle}>Share Your Review</h2>
        {user ? (
          <div style={{ maxWidth: "600px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#2d3748" }}>
                Your Rating
              </label>
              <div style={styles.starContainer}>
                {[1,2,3,4,5].map((n) => (
                  <Star
                    key={n}
                    filled={rating >= n}
                    onClick={() => setRating(n)}
                    size="2.5rem"
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#2d3748" }}>
                Your Comment
              </label>
              <textarea 
                rows={4}
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                style={styles.textarea}
                placeholder="Share your thoughts about this item..."
              />
            </div>
            <button 
              onClick={createReview} 
              style={{ ...styles.button, ...styles.buttonPrimary, fontSize: "1.1rem", padding: "1rem 2rem" }}
            >
              📝 Post Review
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.1rem", color: "#718096", marginBottom: "1rem" }}>
              Please log in to share your review
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              style={{ ...styles.button, ...styles.buttonPrimary }}
            >
              🔐 Login to Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}