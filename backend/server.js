import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import admin from "firebase-admin";
import dotenv from "dotenv";
import axios from "axios";

import reviewsRouter from "./routes/reviews.js";
import usersRouter from "./routes/users.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// ------------------- Firebase Admin init -------------------
console.log("🔧 Initializing Firebase Admin...");
try {
  const serviceAccountPath = "./serviceAccountKey.json";
  console.log("📁 Looking for service account at:", serviceAccountPath);
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Service account file not found at: " + serviceAccountPath);
  }
  
  const serviceAccountContent = fs.readFileSync(serviceAccountPath, "utf8");
  console.log("✅ Service account file found");
  
  const serviceAccount = JSON.parse(serviceAccountContent);
  
  // Validate required fields
  const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
  for (const field of requiredFields) {
    if (!serviceAccount[field]) {
      throw new Error(`Missing required field in service account: ${field}`);
    }
  }
  
  console.log("✅ Service account JSON parsed successfully");
  console.log("🔧 Project ID:", serviceAccount.project_id);
  console.log("🔧 Client Email:", serviceAccount.client_email);
  
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log("🎉 Firebase Admin initialized successfully!");
  
  // Test Firestore connection immediately
  const db = admin.firestore();
  console.log("🔧 Testing Firestore connection...");
  const collections = await db.listCollections();
  console.log("✅ Firestore connection test passed! Available collections:", collections.map(c => c.id));
  
} catch (err) {
  console.error("❌ Failed Firebase init:", err.message);
  console.error("Error details:", err);
  process.exit(1);
}

// ------------------- Root -------------------
app.get("/", (req, res) => {
  res.send("Firebase connected 🎉");
});

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
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&append_to_response=videos`
      );
      return res.json(response.data);
    }
  } catch (err) {
    console.error("Item fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch item details" });
  }
});

// ------------------- Home movies -------------------
app.get("/api/home-movies", async (req, res) => {
  if (!TMDB_KEY) return res.status(500).json({ error: "TMDB_API_KEY not set" });

  try {
    const endpoints = [
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&page=1`,
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&page=2`,
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=1`,
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&page=2`,
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&page=1`,
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&page=2`,
    ];

    const responses = await Promise.all(endpoints.map((url) => axios.get(url)));
    const movies = responses
      .map((r) => r.data.results)
      .flat()
      .filter((v, i, a) => a.findIndex((m) => m.id === v.id) === i);

    const db = admin.firestore();
    const moviesWithRatings = await Promise.all(
      movies.map(async (movie) => {
        try {
          const snap = await db.collection("reviews").where("itemId", "==", movie.id.toString()).get();
          const reviews = snap.docs.map((d) => d.data());
          const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
            : 0;
          return { ...movie, avgRating };
        } catch {
          return { ...movie, avgRating: 0 };
        }
      })
    );

    res.json({ movies: moviesWithRatings });
  } catch (err) {
    console.error("Home movies fetch error:", err.message || err);
    res.status(500).json({ error: "Failed to fetch home movies" });
  }
});

// ------------------- Debug Firestore endpoint -------------------
app.get("/api/debug-firestore", async (req, res) => {
  try {
    const db = admin.firestore();
    const itemId = req.query.itemId || "557";
    
    console.log("🔍 Debug: Testing Firestore access for itemId:", itemId);
    
    const collections = await db.listCollections();
    console.log("📂 Available collections:", collections.map(c => c.id));
    
    const reviewsRef = db.collection("reviews");
    const testQuery = reviewsRef.where("itemId", "==", itemId);
    const testSnap = await testQuery.get();
    
    console.log(`🔍 Found ${testSnap.size} reviews for itemId: ${itemId}`);
    
    let sampleData = null;
    if (testSnap.size > 0) {
      sampleData = testSnap.docs[0].data();
    }
    
    res.json({
      success: true,
      collections: collections.map(c => c.id),
      reviewCount: testSnap.size,
      sampleData: sampleData,
      itemIdTested: itemId
    });
    
  } catch (err) {
    console.error("❌ Firestore debug error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

// ------------------- Routes -------------------
app.use("/api/items", reviewsRouter);
app.use("/api/users", usersRouter); // This will use the auth middleware from users.js

// ------------------- Start server -------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));