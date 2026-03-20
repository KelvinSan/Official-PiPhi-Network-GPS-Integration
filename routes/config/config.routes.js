import express from "express";
import { body, validationResult } from "express-validator";
import { configureGPSDevice } from "../../lib/gps.js";
export const router = express.Router();


const schema = [body('path').not().isEmpty().withMessage('Please select a device before continuing')]


router.post('/config', schema,async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const payload = req.body
    const result = await configureGPSDevice(payload)
    return res.json({
        success: true,
        device_id: result.device_id,
        path: result.path,
        message: result.message,
        device: result.device ?? null,
    })
})