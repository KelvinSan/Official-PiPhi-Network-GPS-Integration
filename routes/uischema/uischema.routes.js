import express from "express";
import { getGPSDevicePaths } from "../../lib/gps.js";
export const uischemaRouter = express.Router();

const schema = {
        "title": "USB GPS Integration Configuration",
        "description":
            "Configuration for USB GPS integration.",
        "type": "object",
        "required": ["port"],
        "properties": {
            "port": {
                "type": "string",
                "title": "GPS Device Path",
                "description":
                    "USB GPS device path/address",
                "enum":[],
                "errorMessage": "Please select a device before continuing",
            }
        },
    }

uischemaRouter.get('/ui', async(req, res) => {
    const paths = await getGPSDevicePaths();
    schema.properties.port.enum = paths.map(path => path.path);
    res.json(schema)
})