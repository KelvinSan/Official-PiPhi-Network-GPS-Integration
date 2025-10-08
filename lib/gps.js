import { SerialPort, ReadlineParser } from 'serialport'
import { client } from './mqttclient.js'
import { logger } from '../server.js'
import nmea from 'nmea-simple'
// Create a port



export async function initializeClient(serialPort) {
    const gps = new GPS(serialPort)
    return gps
}


export async function getGPSerialPort(serialPort) {
    return GPS.gpsSerialPortMap[serialPort]
}

export async function getGPSDevicePaths() {
    const ports = await SerialPort.list();
    const gpsDevices = ports
        .filter(port => isGPSDevice(port))
        .map(port => ({ path: port.path }));

    return gpsDevices;
}

function isGPSDevice(port) {
    const hwid = getHwidString(port);
    return hwid.includes('USB VID:PID=1546:01A7') || hwid.includes('USB VID:PID=1546:01A8');
}

function getHwidString(port) {
    let hwid = `USB VID:PID=${port.vendorId ?? '????'}:${port.productId ?? '????'}`;
    if (port.serialNumber) hwid += ` SER=${port.serialNumber}`;
    if (port.locationId) hwid += ` LOCATION=${port.locationId}`;
    return hwid;
}


export class GPS {
    static gpsSerialPortMap = {

    }
    constructor(serialPort) {
        if (!serialPort) {
            throw new Error('No serial port specified');
        }
        try {
            this.serialPort = new SerialPort({
                path: serialPort,
                baudRate: 57600,
                autoOpen: false
            });
            this.dataStream = null;
            GPS.gpsSerialPortMap[serialPort] = this
            this.parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
        } catch (error) {
            console.error(error);
        }

    }

    async openSerialPort() {
        if (!this.serialPort.isOpen) {
           
            this.serialPort.open((error) => {
                if (error) {
                    console.error(error);
                }
            });
        }
    }

    async closeSerialPort() {
        if(this.serialPort.isOpen){
            this.serialPort.close();
        }
        
    }

    /**
     * This function is called whenever a new NMEA sentence is received
     * from the GPS device. It parses the sentence and if it's a valid
     * RMC or GGA sentence, it constructs a telemetry packet and
     * publishes it to the MQTT broker.
     *
     * @param {string} signature - The signature that was generated
     * when the telemetry was requested.
     */
    async getRealTimeData(signature) {
        /**
         * This event is triggered whenever a new NMEA sentence is received
         * from the GPS device.
         *
         * @param {string} nmeaSentence - The received NMEA sentence.
         */
        this.parser.on('data', (nmeaSentence) => {
            try {
                /**
                 * Parse the received NMEA sentence.
                 */
                const parsed = nmea.parseNmeaSentence(nmeaSentence);
                if (parsed.sentenceId === 'RMC' && parsed.status === 'valid') {
                    /**
                     * If the sentence is a valid RMC sentence, construct a
                     * telemetry packet with the latitude, longitude, timestamp,
                     * and signature.
                     */
                    const packet = {
                        latitude: parsed.latitude,
                        longitude: parsed.longitude,
                        timestamp: parsed.datetime,
                        signature: signature
                    };
                    /**
                     * Publish the telemetry packet to the MQTT broker.
                     */
                    logger.info("Coordinates found latitude: " + packet.latitude + " longitude: " + packet.longitude + " sending telemetry packet to MQTT broker")
                    client.publish('piphi/telemetry', JSON.stringify(packet));
                } else if (parsed.sentenceId === 'GGA' && parsed.fixType !== 'none') {
                    /**
                     * If the sentence is a valid GGA sentence, construct a
                     * telemetry packet with the latitude, longitude, timestamp,
                     * satellites in view, and signature.
                     */
                    const packet = {
                        latitude: parsed.latitude,
                        longitude: parsed.longitude,
                        timestamp: parsed.time,
                        satellites: parsed.satellitesInView,
                        signature: signature
                    };
                    /**
                     * Publish the telemetry packet to the MQTT broker.
                     */
                    logger.info("Coordinates found latitude: " + packet.latitude + " longitude: " + packet.longitude + " sending telemetry packet to MQTT broker")
                    client.publish('piphi/telemetry', JSON.stringify(packet));
                }
                else{
                    logger.info("Searching for coordinates ... " + nmeaSentence)
                }
            } catch (error) {
                /**
                 * If the error message includes 'No known parser for sentence ID',
                 * it means that the sentence is not a known NMEA sentence and
                 * we can ignore it.
                 */
                if (error.message.includes('No known parser for sentence ID')) {
                    return;
                }
                throw error;
            }
        });
    }
}


