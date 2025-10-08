import crypto from "crypto";
import { client } from "./mqttclient.js";
export async function sign_payload(payload,secret) {
    const data = JSON.stringify(payload, null, 2)
    return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export const send_telemetry = async(payload) => {
    
    
    client.publish('piphi/telemetry',JSON.stringify({"signature":"test"}))
}