import express from "express";
import { body, validationResult } from "express-validator";
import { client } from "../../lib/mqttclient.js";
import { send_telemetry, sign_payload } from "../../lib/common.js";
import { getGPSerialPort, GPS, initializeClient } from "../../lib/gps.js";
export const router = express.Router();


const schema = [body('path').not().isEmpty().withMessage('Please select a device before continuing')]


router.post('/config', schema,async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let payload = req.body
    const signature = await sign_payload(payload,req.body.secret)
    const findUsedGPS = await getGPSerialPort(payload.path)
    if(findUsedGPS){
        console.log("Found used GPS")
        await findUsedGPS.closeSerialPort()
        delete GPS.gpsSerialPortMap[payload.path]
    }
    const gps = await initializeClient(payload.path)
    await gps.openSerialPort()
    await gps.getRealTimeData(signature)
    return res.json({
        "success": true,
        "message": "Sending MQTT telemetry topic"
    })
})