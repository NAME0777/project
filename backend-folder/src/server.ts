/**
 * ============================================================
 * SERVER — ประกอบ Express app และเปิดพอร์ต
 * ============================================================
 */
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { subjectsRouter } from "./routes/subjects.js";
import { notesRouter } from "./routes/notes.js";
import { ocrRouter } from "./routes/ocr.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/ocr", ocrRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "ไม่พบ endpoint นี้" }));

app.listen(port, () => {
  console.log(`notes-hub backend running at http://localhost:${port}`);
});
