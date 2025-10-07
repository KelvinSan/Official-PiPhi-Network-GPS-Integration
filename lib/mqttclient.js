import mqtt from "mqtt"
import { logger } from "../server.js"
const protocol = 'mqtt'
const host = 'localhost'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`


export const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
})

client.on('connect', () => {
  logger.info('Connected to MQTT broker')
})

