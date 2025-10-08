import express from "express";
import { getGPSDevicePaths } from "../../lib/gps.js";
export const router = express.Router();

router.get('/discovery', async (req, res) => {
    const paths = await getGPSDevicePaths()
    const devices = paths.map(path => ({ path: path.path, name: path.path }))
    res.json({
        "devices": devices
    })
})