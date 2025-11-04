import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase"; // Changed from getAuth to auth
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

      console.log("🔄 Fetching user reviews and history...");
      const token = await auth.currentUser.getIdToken();
      
      const response = await axios.get(`${API}/api/users/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ My reviews response:", response.data);
      
      // Handle both response formats
      if (response.data.reviews !== undefined && response.data.history !== undefined) {
        setReviews(response.data.reviews || []);
        setHistory(response.data.history || []);
      } else {
        // If the response is just the reviews array directly
        setReviews(response.data || []);
        setHistory([]);
      }
      
    } catch (err) {
      console.error("❌ Fetch my reviews error:", err);
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
      console.log("🗑️ Deleting review:", reviewId);
      
      // FIXED: Updated API path to match backend routes
      await axios.delete(`${API}/api/items/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ Review deleted successfully");
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("❌ Delete review error:", err);
      alert(err.response?.data?.error || err.message || "Failed to delete review");
    }
  };

  const handleItemClick = (itemId, itemType, itemName) => {
    navigate(`/item/${itemId}?type=${itemType}&name=${encodeURIComponent(itemName || itemId)}`);
  };

  const renderStars = (rating) => {
    const fullStars = Math.round(rating);
    return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  };

  useEffect(() => {
    fetchReviews();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchReviews();
      } else {
        setReviews([]);
        setHistory([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!auth.currentUser) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>My Reviews</h2>
        <p>Please log in to see your reviews and history.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "1rem" }}>
      <h2>My Reviews & History</h2>
      {loading && <p>Loading your reviews and history...</p>}
      
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

      {/* Reviews Section */}
      <section style={{ marginTop: "2rem" }}>
        <h3 style={{ borderBottom: "2px solid #0b76d1", paddingBottom: "0.5rem" }}>
          Your Posted Reviews ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "2rem",
            color: "#666",
            fontStyle: "italic"
          }}>
            No reviews yet. Start reviewing items to see them here!
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
                e.target.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f9f9f9";
                e.target.style.boxShadow = "none";
              }}
              onClick={() => handleItemClick(
                review.itemId, 
                review.itemType, 
                review.itemName
              )}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 0.5rem 0", color: "#0b76d1" }}>
                    {review.itemName || `Item ${review.itemId}`}
                  </h4>
                  <div style={{ 
                    display: "inline-block", 
                    background: "#e0e0e0", 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "0.8rem",
                    marginBottom: "0.5rem"
                  }}>
                    {review.itemType || "movie"}
                  </div>
                  
                  <div style={{ margin: "0.5rem 0" }}>
                    <strong>Rating:</strong> 
                    <span style={{ color: "#ffc107", fontSize: "1.2rem", marginLeft: "0.5rem" }}>
                      {renderStars(review.rating)} ({review.rating}/5)
                    </span>
                  </div>
                  
                  {review.comment && (
                    <div style={{ margin: "0.5rem 0" }}>
                      <strong>Comment:</strong> 
                      <p style={{ margin: "0.25rem 0", fontStyle: "italic" }}>"{review.comment}"</p>
                    </div>
                  )}
                  
                  {review.createdAt && (
                    <small style={{ color: "#666" }}>
                      Posted: {new Date(review.createdAt).toLocaleString()}
                    </small>
                  )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when clicking delete
                    handleDelete(review.id);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Search History Section */}
      <section style={{ marginTop: "2rem" }}>
        <h3 style={{ borderBottom: "2px solid #28a745", paddingBottom: "0.5rem" }}>
          Recent Search History ({history.length})
        </h3>
        
        {history.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "2rem",
            color: "#666",
            fontStyle: "italic"
          }}>
            No search history yet. Your recent searches will appear here.
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              style={{
                border: "1px dashed #ccc",
                borderRadius: "6px",
                padding: "0.75rem",
                marginBottom: "0.5rem",
                backgroundColor: "#f0f8f0",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e8f5e8";
                e.target.style.borderColor = "#28a745";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f0f8f0";
                e.target.style.borderColor = "#ccc";
              }}
              onClick={() => handleItemClick(
                item.itemId, 
                item.itemType, 
                item.itemName
              )}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#28a745" }}>
                    {item.itemName || `Item ${item.itemId}`}
                  </strong>
                  <span style={{ 
                    marginLeft: "0.5rem",
                    background: "#d4edda", 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "0.8rem",
                    color: "#155724"
                  }}>
                    {item.itemType || "movie"}
                  </span>
                </div>
                
                {item.createdAt && (
                  <small style={{ color: "#666" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </small>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Refresh Button */}
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button 
          onClick={fetchReviews}
          style={{
            padding: "10px 20px",
            background: "#0b76d1",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}