import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", f), "utf-8"));
const DATA = { en: load("speaking.json"), zh: load("speaking-zh.json") };

const langOf = (req) => (req.query.lang === "zh" ? "zh" : "en");

const router = express.Router();

router.get("/shadowing", (req, res) => {
  res.json(DATA[langOf(req)].shadowing);
});

router.get("/dialogues", (req, res) => {
  res.json(DATA[langOf(req)].dialogues);
});

export default router;
