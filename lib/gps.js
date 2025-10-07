import { SerialPort } from 'serialport'
import {client} from './mqttclient.js'
// Create a port



export async function initializeClient(serialPort) {
    const gps = new GPS(serialPort)
    return gps
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


class GPS {

    constructor(gpsPort) {
        if (!gpsPort) {
            throw new Error('No port specified');
        }

        this.gpsSerialPort = new SerialPort({
            path: gpsPort,
            baudRate: 57600,
            autoOpen: false
        });
        this.dataStream = null

        this.gpsSerialPortMap = {

        }
    }

    async openSerialPort() {
        this.gpsSerialPort.open();
    }

    async closeSerialPort() {
        this.gpsSerialPort.close();
    }

    async realTimeData() {

        for await (const chunk of this.gpsSerialPort) {
            client.publish('piphi/gps', chunk.toString())
        }

        
    }

    


}


