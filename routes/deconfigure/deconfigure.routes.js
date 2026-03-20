import express from "express";
import { deconfigureGPSDevice } from "../../lib/gps.js";

export const router = express.Router();

router.post('/deconfigure', async (req, res) => {
    const result = await deconfigureGPSDevice(req.body || {});
    res.json(result);
});
