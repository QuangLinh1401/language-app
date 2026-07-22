// Vercel serverless entry point. Vercel serves any file under /api as a
// serverless function; here we hand every /api/* request to the Express app.
// (The vercel.json rewrite routes /api/(.*) to this file, and Express matches
// the original path — e.g. /api/vocabulary/topics.)
//
// Environment variables (DATABASE_URL, ANTHROPIC_API_KEY) come from the Vercel
// project settings, so no dotenv is needed here.
import app from "../backend/app.js";

export default app;
