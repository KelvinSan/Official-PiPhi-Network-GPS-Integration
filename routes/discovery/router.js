import express from "express";
import { getGPSDevicePaths } from "../../lib/gps.js";
export const router = express.Router();

async function handleDiscovery(_req, res) {
    const devices = await getGPSDevicePaths()
    res.json({
        devices,
    })
}

router.get('/discovery', handleDiscovery)
router.get('/discover', handleDiscovery)