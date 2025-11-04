import express from "express";
import admin from "firebase-admin";

const router = express.Router();

// ------------------- Auth middleware -------------------
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "No token" });
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("verifyToken error:", err?.code || err?.message || err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ------------------- Get reviews for a single item -------------------
router.get("/:itemId/reviews", async (req, res) => {
  const itemId = req.params.itemId;
  console.log("🔍 Fetching reviews for item ID:", itemId, "(type:", typeof itemId + ")");
  
  try {
    const db = admin.firestore();
    console.log("✅ Firestore instance ready");
    
    // First try without ordering to see if that's the issue
    const reviewsRef = db.collection("reviews");
    let snap;
    
    try {
      // Try with ordering first
      console.log("🔍 Trying query WITH ordering...");
      const queryWithOrder = reviewsRef
        .where("itemId", "==", itemId)
        .orderBy("createdAt", "desc");
      
      snap = await queryWithOrder.get();
      console.log("✅ Query with ordering succeeded");
      
    } catch (orderError) {
      if (orderError.code === 3 || orderError.message?.includes('INVALID_ARGUMENT') || orderError.message?.includes('index')) {
        console.log("⚠️ Ordering failed, trying without ordering...");
        // If ordering fails, try without it
        const queryWithoutOrder = reviewsRef.where("itemId", "==", itemId);
        snap = await queryWithoutOrder.get();
        console.log("✅ Query without ordering succeeded");
      } else {
        throw orderError;
      }
    }
    
    console.log(`✅ Query completed. Found ${snap.size} reviews for item ${itemId}`);
    
    const reviews = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        rating: data.rating || 0,
        comment: data.comment || "",
        itemType: data.itemType || "movie",
        userId: data.userId || null,
        username: data.username || "Anonymous",
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });
    
    console.log(`🎉 Sending ${reviews.length} reviews to client`);
    return res.json(reviews);
    
  } catch (err) {
    console.error("❌ Fetch reviews error:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    
    return res.status(500).json({ 
      error: "Failed to fetch reviews",
      details: err.message 
    });
  }
});

// ------------------- Post review for an item -------------------
router.post("/:itemId/reviews", verifyToken, async (req, res) => {
  const itemId = req.params.itemId;
  const { rating, comment, itemType, itemName } = req.body;

  console.log("📝 Creating review for item:", itemId);

  if (rating === undefined || typeof rating !== "number") {
    return res.status(400).json({ error: "Invalid rating" });
  }

  try {
    const db = admin.firestore();
    const reviewData = {
      itemId,
      itemType: itemType || "movie",
      itemName: itemName || null,
      userId: req.user.uid,
      username: req.user.email || "Anonymous",
      rating,
      comment: comment || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const ref = await db.collection("reviews").add(reviewData);
    const doc = await ref.get();
    const data = doc.data();
    
    console.log("✅ Review created successfully:", doc.id);
    
    return res.status(201).json({
      id: doc.id,
      itemId: data.itemId,
      itemName: data.itemName || null,
      rating: data.rating || 0,
      comment: data.comment || "",
      itemType: data.itemType || "movie",
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    });
  } catch (err) {
    console.error("Create review error:", err);
    return res.status(500).json({ error: "Failed to create review" });
  }
});

// ------------------- Update review -------------------
router.put("/reviews/:id", verifyToken, async (req, res) => {
  const reviewId = req.params.id;
  const { rating, comment } = req.body;

  console.log("✏️ Updating review:", reviewId);

  try {
    const db = admin.firestore();
    const docRef = db.collection("reviews").doc(reviewId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await docRef.update({
      rating: Number(rating),
      comment: comment || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    
    return res.json({
      id: updatedDoc.id,
      itemId: data.itemId,
      itemName: data.itemName || null,
      rating: data.rating || 0,
      comment: data.comment || "",
      itemType: data.itemType || "movie",
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    });
  } catch (err) {
    console.error("Update review error:", err);
    return res.status(500).json({ error: "Failed to update review" });
  }
});

// ------------------- Delete review -------------------
router.delete("/reviews/:id", verifyToken, async (req, res) => {
  const reviewId = req.params.id;
  
  console.log("🗑️ Deleting review:", reviewId);

  try {
    const db = admin.firestore();
    const docRef = db.collection("reviews").doc(reviewId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await docRef.delete();
    console.log("✅ Review deleted successfully");
    return res.json({ success: true });
  } catch (err) {
    console.error("Delete review error:", err);
    return res.status(500).json({ error: "Failed to delete review" });
  }
});

// ------------------- My Reviews & Search History -------------------
router.get("/my-reviews", verifyToken, async (req, res) => {
  try {
    const db = admin.firestore();

    // Get user reviews
    const reviewsSnap = await db.collection("reviews")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    
    const reviews = reviewsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        rating: data.rating || 0,
        comment: data.comment || "",
        itemType: data.itemType || "movie",
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    // Get search history
    const historySnap = await db.collection("search-history")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    
    const history = historySnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        itemType: data.itemType || "movie",
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    return res.json({ reviews, history });
  } catch (err) {
    console.error("Fetch my reviews & history error:", err);
    return res.status(500).json({ error: "Failed to fetch my reviews & history" });
  }
});

export default router;