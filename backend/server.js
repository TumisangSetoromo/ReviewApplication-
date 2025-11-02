import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import admin from "firebase-admin";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// ------------------- Firebase Admin init -------------------
try {
  const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🎉 Firebase connected!");
} catch (err) {
  console.error("Failed Firebase init:", err?.message || err);
  process.exit(1);
}

const db = admin.firestore();

// ------------------- Root -------------------
app.get("/", (req, res) => {
  res.send("Firebase connected 🎉");
});

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

// ------------------- API keys -------------------
const TMDB_KEY = process.env.TMDB_API_KEY || "";
const FOURSQUARE_KEY = process.env.FOURSQUARE_API_KEY || "";

// ------------------- Search endpoint -------------------
app.get("/api/search", async (req, res) => {
  const q = req.query.q?.trim();
  const type = (req.query.type || "movie").toLowerCase();
  const location = req.query.location?.trim();

  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });

  try {
    if (type === "restaurant") {
      let results = [];
      if (FOURSQUARE_KEY) {
        try {
          const params = { query: q, limit: 20 };
          if (location) params.near = location;
          const resp = await axios.get("https://api.foursquare.com/v3/places/search", {
            headers: { Accept: "application/json", Authorization: FOURSQUARE_KEY },
            params,
          });
          results = resp.data?.results || [];
        } catch (err) {
          console.error("Foursquare search error:", err?.response?.data || err?.message || err);
        }
      }

      if (!results.length) {
        // fallback to OSM
        try {
          const osmResp = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: `${q}${location ? `, ${location}` : ""}`, format: "json", limit: 20 },
            headers: { "User-Agent": "review-platform-app/1.0" },
          });
          results = (osmResp.data || []).map((item) => ({
            osm_id: item.osm_id,
            name: item.display_name,
            location: { address: item.display_name, lat: item.lat, lon: item.lon },
          }));
        } catch (osmErr) {
          console.error("OSM fallback error:", osmErr?.response || osmErr?.message || osmErr);
        }
      }

      return res.json({ results });
    } else {
      if (!TMDB_KEY) return res.status(500).json({ error: "TMDB_API_KEY not set" });
      const tmdbType = type === "multi" ? "multi" : "movie";
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/${tmdbType}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`
      );
      return res.json({ results: response.data.results || [] });
    }
  } catch (err) {
    console.error("Search error:", err?.response?.data || err?.message || err);
    return res.status(500).json({ error: "External API error" });
  }
});

// ------------------- Item details -------------------
app.get("/api/items/:id", async (req, res) => {
  const id = req.params.id;
  const type = (req.query.type || "movie").toLowerCase();

  try {
    if (type === "restaurant") {
      if (!FOURSQUARE_KEY) return res.status(400).json({ error: "No Foursquare API key set" });
      const response = await axios.get(`https://api.foursquare.com/v3/places/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json", Authorization: FOURSQUARE_KEY },
      });
      return res.json(response.data);
    } else {
      if (!TMDB_KEY) return res.status(500).json({ error: "TMDB_API_KEY not set" });
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`);
      return res.json(response.data);
    }
  } catch (err) {
    console.error("Item fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch item details" });
  }
});

// ------------------- Reviews CRUD -------------------
// GET reviews
app.get("/api/items/:itemId/reviews", async (req, res) => {
  const itemId = req.params.itemId;
  try {
    const snap = await db.collection("reviews").where("itemId", "==", itemId).orderBy("createdAt", "desc").get();
    const reviews = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        itemId: data.itemId,
        itemName: data.itemName || null,
        rating: data.rating || 0,
        comment: data.comment || "",
        itemType: data.itemType || "movie",
        userId: data.userId || null,
        username: data.username || "Anonymous",
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      };
    });
    return res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST review
app.post("/api/items/:itemId/reviews", verifyToken, async (req, res) => {
  const itemId = req.params.itemId;
  const { rating, comment, itemType, itemName } = req.body;
  if (rating === undefined || typeof rating !== "number") return res.status(400).json({ error: "Invalid rating" });

  try {
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
    return res.status(201).json({
      id: doc.id,
      itemId: data.itemId,
      itemName: data.itemName || null,
      rating: data.rating || 0,
      comment: data.comment || "",
      itemType: data.itemType || "movie",
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
    });
  } catch (err) {
    console.error("Create review error:", err);
    return res.status(500).json({ error: "Failed to create review" });
  }
});

// ------------------- Start server -------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
