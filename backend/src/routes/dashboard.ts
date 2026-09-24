/**
 * ---- /api/dashboard — สถิติภาพรวม (เฉพาะผู้ดูแล ตรวจสิทธิ์ฝั่ง frontend) --
 */
import { Router } from "express";
import { dashboardStats, recentEdits } from "../store.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (_req, res) => {
  res.json({ stats: dashboardStats, recentEdits });
});
