import express from "express";
import cors from "cors";

import vocabularyRoutes from "./src/routes/vocabulary.js";
import grammarRoutes from "./src/routes/grammar.js";
import listeningRoutes from "./src/routes/listening.js";
import readingRoutes from "./src/routes/reading.js";
import speakingRoutes from "./src/routes/speaking.js";
import progressRoutes from "./src/routes/progress.js";

// The configured Express app, with no .listen() — so it can be used both by
// the local dev server (server.js) and as a Vercel serverless function
// (../api/index.js).
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/vocabulary", vocabularyRoutes);
app.use("/api/grammar", grammarRoutes);
app.use("/api/listening", listeningRoutes);
app.use("/api/reading", readingRoutes);
app.use("/api/speaking", speakingRoutes);
app.use("/api/progress", progressRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
