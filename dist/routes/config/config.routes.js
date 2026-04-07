import express from "express";
import { body, validationResult } from "express-validator";
import { buildConfigApplyResponse, formatConfigApplyLog, formatRuntimeAuthSyncLog, } from "piphi-runtime-kit-node";
import { configureGPSDevice } from "../../lib/gps.js";
import { getRuntimeContext } from "../../lib/runtime.js";
import { logger } from "../../server.js";
export const router = express.Router();
const schema = [
    body("path").not().isEmpty().withMessage("Please select a device before continuing"),
];
function readHeaderValue(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
function syncRuntimeAuthFromRequest(req, payload) {
    const runtime = getRuntimeContext();
    const parsed = runtime.auth.syncFromHeaders({
        "x-container-id": readHeaderValue(req.header("x-container-id") ?? undefined),
        "x-piphi-integration-token": readHeaderValue(req.header("x-piphi-integration-token") ?? undefined),
    }, typeof payload.container_id === "string" ? payload.container_id : null);
    logger.info(formatRuntimeAuthSyncLog(parsed, typeof payload.container_id === "string" ? payload.container_id : null));
}
router.post("/config", schema, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const payload = (req.body ?? {});
    syncRuntimeAuthFromRequest(req, payload);
    logger.info(formatConfigApplyLog({
        id: String(payload.id ?? payload.path ?? "gps-device"),
        containerId: typeof payload.container_id === "string" ? payload.container_id : null,
        integrationId: null,
        ...payload,
    }));
    const result = await configureGPSDevice(payload);
    return res.json({
        ...buildConfigApplyResponse({
            configId: String(result.device_id ?? payload.id ?? payload.path ?? "gps-device"),
            containerId: typeof payload.container_id === "string" ? payload.container_id : null,
            metadata: {
                path: result.path,
                device: result.device ?? null,
                message: result.message,
            },
        }),
        path: result.path,
        message: result.message,
        device: result.device ?? null,
    });
});
