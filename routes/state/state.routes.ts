import express from "express";

import { getStatePayload } from "../../lib/gps.js";

export const router = express.Router();

router.get("/state", (_req, res) => {
  res.json(getStatePayload());
});
