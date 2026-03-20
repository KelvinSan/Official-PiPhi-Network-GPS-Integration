import crypto from "crypto";

const MAX_RUNTIME_EVENTS = 100;

function createDefaultDeviceState(deviceId, path = null) {
    return {
        deviceId,
        path,
        connected: false,
        fix_status: "idle",
        lastMetrics: {},
        fix_details: {
            signal_state: "idle",
            fix_quality: "unknown",
            position_source: "none",
            stale: false,
            last_sentence_at: null,
            last_fix_at: null,
            last_valid_fix_at: null,
            fix_age_ms: null,
            satellites: null,
            hdop: null,
            altitude_meters: null,
        },
        discovery: null,
        updatedAt: null,
    };
}

const runtimeState = {
    startedAt: new Date().toISOString(),
    status: "starting",
    activeConfigs: {},
    devices: {},
    telemetry: {
        publishedCount: 0,
        lastPayload: null,
        lastPublishedAt: null,
        lastDelivery: "idle",
    },
    mqtt: {
        connected: false,
    },
    lastError: null,
    recentEvents: [],
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function setRuntimeStatus(status) {
    runtimeState.status = status;
}

export function setMqttStatus(connected) {
    runtimeState.mqtt.connected = Boolean(connected);
}

export function setRuntimeError(error) {
    runtimeState.lastError = {
        message: error instanceof Error ? error.message : String(error),
        ts: new Date().toISOString(),
    };
}

export function clearRuntimeError() {
    runtimeState.lastError = null;
}

export function upsertActiveConfig(config) {
    const deviceId = config.deviceId || config.id || config.path;
    runtimeState.activeConfigs[deviceId] = {
        deviceId,
        path: config.path,
        containerId: config.containerId ?? null,
        configName: config.configName ?? config.path,
        configuredAt: new Date().toISOString(),
    };
    if (!runtimeState.devices[deviceId]) {
        runtimeState.devices[deviceId] = createDefaultDeviceState(deviceId, config.path);
    }
    runtimeState.status = "configured";
    return runtimeState.activeConfigs[deviceId];
}

export function removeActiveConfig(deviceId) {
    delete runtimeState.activeConfigs[deviceId];
    if (Object.keys(runtimeState.activeConfigs).length === 0) {
        runtimeState.status = "idle";
    }
}

export function updateDeviceRuntime(deviceId, patch) {
    const existingDevice = runtimeState.devices[deviceId] || createDefaultDeviceState(deviceId, patch.path ?? null);
    runtimeState.devices[deviceId] = {
        ...existingDevice,
        ...patch,
        fix_details: {
            ...existingDevice.fix_details,
            ...(patch.fix_details ?? {}),
        },
        updatedAt: new Date().toISOString(),
    };
    return runtimeState.devices[deviceId];
}

export function recordRuntimeEvent({ type, severity = "info", device_id = null, data = {} }) {
    const event = {
        event_id: crypto.randomUUID(),
        type,
        ts: new Date().toISOString(),
        severity,
        device_id,
        data,
    };
    runtimeState.recentEvents.unshift(event);
    runtimeState.recentEvents = runtimeState.recentEvents.slice(0, MAX_RUNTIME_EVENTS);
    return event;
}

export function noteTelemetry(payload, delivery) {
    runtimeState.telemetry.publishedCount += 1;
    runtimeState.telemetry.lastPayload = clone(payload);
    runtimeState.telemetry.lastPublishedAt = new Date().toISOString();
    runtimeState.telemetry.lastDelivery = delivery;
}

export function getRuntimeSnapshot() {
    return clone(runtimeState);
}

export function getRecentEvents(limit = 50) {
    return clone(runtimeState.recentEvents.slice(0, limit));
}

export function getActiveConfigs() {
    return clone(Object.values(runtimeState.activeConfigs));
}

export function getHealthSnapshot() {
    const activeConfigCount = Object.keys(runtimeState.activeConfigs).length;
    const devices = Object.values(runtimeState.devices);
    const connectedDevices = devices.filter(device => device.connected).length;
    const devicesWithCurrentFix = devices.filter(device => device.fix_details?.signal_state === "fixed").length;
    const devicesWithStaleFix = devices.filter(device => device.fix_details?.signal_state === "stale").length;
    const healthy = activeConfigCount === 0
        ? runtimeState.lastError === null
        : devices.some(device => device.connected);
    return {
        status: healthy ? "ok" : "degraded",
        runtime_status: runtimeState.status,
        mqtt_connected: runtimeState.mqtt.connected,
        configured_devices: activeConfigCount,
        connected_devices: connectedDevices,
        devices_with_current_fix: devicesWithCurrentFix,
        devices_with_stale_fix: devicesWithStaleFix,
        last_error: runtimeState.lastError,
    };
}
