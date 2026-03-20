import express from "express";
import { getDiagnosticsPayload } from "../../lib/gps.js";

export const router = express.Router();

router.get('/diagnostics', (_req, res) => {
    res.json(getDiagnosticsPayload());
});
