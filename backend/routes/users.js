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

// Apply auth middleware to all routes
router.use(verifyToken);

// ------------------- Track search history -------------------
router.post("/track-search", async (req, res) => {
  const { itemId, itemName, itemType } = req.body;

  try {
    const db = admin.firestore();
    await db.collection("searchHistory").add({
      userId: req.user.uid,
      itemId,
      itemName,
      itemType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Search tracked for user:", req.user.uid);
    res.json({ success: true });
  } catch (err) {
    console.error("Track search error:", err);
    res.status(500).json({ error: "Failed to track search" });
  }
});

// ------------------- Get user's reviews and search history -------------------
router.get("/my-reviews", async (req, res) => {
  try {
    const db = admin.firestore();
    console.log("🔍 Fetching user data for:", req.user.uid);

    // Get user reviews - WITHOUT ordering to avoid index issues
    const reviewsSnap = await db.collection("reviews")
      .where("userId", "==", req.user.uid)
      .get();
    
    console.log(`✅ Found ${reviewsSnap.size} reviews for user`);
    
    const reviews = reviewsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        rating: data.rating || 0,
        comment: data.comment || "",
        itemType: data.itemType || "movie",
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    // Sort reviews by createdAt manually on the server
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get search history - WITHOUT ordering to avoid index issues
    const historySnap = await db.collection("searchHistory")
      .where("userId", "==", req.user.uid)
      .get();
    
    console.log(`✅ Found ${historySnap.size} search history items for user`);
    
    const history = historySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        itemType: data.itemType || "movie",
        createdAt: data.createdAt?.toDate?.().toISOString() || null,
      };
    });

    // Sort history by createdAt manually on the server
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`🎉 Sending ${reviews.length} reviews and ${history.length} history items to client`);
    
    return res.json({ 
      success: true,
      reviews, 
      history 
    });
    
  } catch (err) {
    console.error("❌ Fetch my reviews & history error:", err);
    return res.status(500).json({ 
      error: "Failed to fetch my reviews & history",
      details: err.message 
    });
  }
});

export default router;