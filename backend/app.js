import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.js";
import vocabularyRoutes from "./src/routes/vocabulary.js";
import grammarRoutes from "./src/routes/grammar.js";
import listeningRoutes from "./src/routes/listening.js";
import readingRoutes from "./src/routes/reading.js";
import speakingRoutes from "./src/routes/speaking.js";
import progressRoutes from "./src/routes/progress.js";
import { requireAuth, withState } from "./src/auth.js";

// The configured Express app, with no .listen() — so it can be used both by
// the local dev server (server.js) and as a Vercel serverless function
// (../api/index.js).
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Everything below requires a logged-in user; withState loads that user's
// progress into req.state and provides req.saveState().
app.use("/api/vocabulary", requireAuth, withState, vocabularyRoutes);
app.use("/api/grammar", requireAuth, withState, grammarRoutes);
app.use("/api/listening", requireAuth, withState, listeningRoutes);
app.use("/api/reading", requireAuth, withState, readingRoutes);
app.use("/api/speaking", requireAuth, speakingRoutes);
app.use("/api/progress", requireAuth, withState, progressRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Central error handler — async route errors land here via asyncHandler/next().
app.use((err, req, res, next) => {
  console.error("[api]", err);
  res.status(500).json({ error: "Server error, please try again" });
});

export default app;
