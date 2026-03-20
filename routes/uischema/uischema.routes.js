import express from "express";
import { getGPSDevicePaths } from "../../lib/gps.js";
export const uischemaRouter = express.Router();

const schema = {
    "title": "USB GPS Integration Configuration",
    "description":
        "Configuration for USB GPS and NMEA serial integrations.",
    "type": "object",
    "required": ["path"],
    "properties": {
        "path": {
            "type": "string",
            "title": "GPS Device Path",
            "description":
                "USB GPS or NMEA serial device path/address",
            "enum": [],
            "enumNames": [],
            "errorMessage": "Please select a device before continuing",
        }
    },
}

async function handleUiSchema(_req, res) {
    const devices = await getGPSDevicePaths();
    schema.properties.path.enum = devices.map(device => device.path);
    schema.properties.path.enumNames = devices.map(device => `${device.name} [${device.confidence}]`);
    res.json(
        {
            "schema": schema,
            "devices": devices,
        }
    )
}

uischemaRouter.get('/ui', handleUiSchema)
uischemaRouter.get('/ui-config', handleUiSchema)