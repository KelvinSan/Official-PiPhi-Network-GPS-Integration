import crypto from "crypto";
import { client } from "./mqttclient.js";
import {
    clearRuntimeError,
    noteTelemetry,
    recordRuntimeEvent,
    setRuntimeError,
    setRuntimeStatus,
} from "./runtime.js";

const telemetryEndpoint = process.env.PIPHI_TELEMETRY_ENDPOINT || process.env.PIPHI_CORE_TELEMETRY_URL || null;
const eventsEndpoint = process.env.PIPHI_EVENTS_ENDPOINT || null;
const containerIdFromEnv = process.env.PIPHI_CONTAINER_ID || null;
const internalTokenFromEnv = process.env.PIPHI_INTEGRATION_INTERNAL_TOKEN || null;

export async function sign_payload(payload, secret) {
    const data = JSON.stringify(payload, null, 2);
    if (secret) {
        return crypto.createHmac("sha256", secret).update(data).digest("hex");
    }
    return crypto.createHash("sha256").update(data).digest("hex");
}

async function postJson(url, payload, headers = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
}

export async function send_telemetry(payload) {
    let delivery = "mqtt";
    try {
        client.publish("piphi/telemetry", JSON.stringify(payload));

        if (telemetryEndpoint && (payload.container_id || containerIdFromEnv)) {
            await postJson(
                telemetryEndpoint,
                {
                    device_id: payload.device_id,
                    timestamp: payload.timestamp,
                    metrics: payload.metrics,
                    units: payload.units || undefined,
                },
                {
                    "X-Container-Id": payload.container_id || containerIdFromEnv,
                    ...(internalTokenFromEnv ? { "X-PiPhi-Integration-Token": internalTokenFromEnv } : {}),
                },
            );
            delivery = "mqtt+rest";
        }
        clearRuntimeError();
    } catch (error) {
        setRuntimeError(error);
        recordRuntimeEvent({
            type: "telemetry_delivery_failed",
            severity: "error",
            device_id: payload.device_id,
            data: { message: error instanceof Error ? error.message : String(error) },
        })
        delivery = "mqtt_error";
    }

    noteTelemetry(payload, delivery);
    setRuntimeStatus("streaming");
    return { delivered: true, delivery };
}

export async function emit_event(eventPayload) {
    const event = recordRuntimeEvent(eventPayload);
    if (eventsEndpoint) {
        try {
            await postJson(eventsEndpoint, eventPayload, {});
        } catch (error) {
            setRuntimeError(error);
        }
    }
    return event;
}

export function handle_runtime_error(error) {
    setRuntimeError(error);
    recordRuntimeEvent({
        type: "runtime_error",
        severity: "error",
        data: {
            message: error instanceof Error ? error.message : String(error),
        },
    });
}
