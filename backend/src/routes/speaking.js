import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "..", "data", "speaking.json");
const speakingData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const router = express.Router();

router.get("/shadowing", (req, res) => {
  res.json(speakingData.shadowing);
});

router.get("/dialogues", (req, res) => {
  res.json(speakingData.dialogues);
});

export default router;
