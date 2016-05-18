/**
 * @name Network
 * @description
 *      Based on [ScanResult](http://developer.android.com/reference/android/net/wifi/ScanResult.html)
 */
export class Network {
    /**
     * @property {string}       SSID
     *      Human readable network name
     */
    SSID: string;
    /**
     * @property {string}       BSSID
     *      MAC Address of the access point
     */
    BSSID: string;
    /**
     * @property {number (int)} frequency
     *      The primary 20 MHz frequency (in MHz) of the channel over which the client is communicating with the access point.
     */
    frequency: number;
    /**
     * @property {number}       level
     *      The detected signal level in dBm, also known as the RSSI.
     */
    level: number;
    /**
     * @property {number}       timestamp
     *      Timestamp in microseconds (since boot) when this result was last seen.
     */
    timestamp: number;
    /**
     * @property {string}       capabilities
     *      Describes the authentication, key management, and encryption schemes supported by the access point.
     */
    capabilities: string;

    constructor (SSID: string | any, BSSID?: string, frequency?: number, level?: number, timestamp?: number, capabilities?: string) {
        if (typeof SSID === 'string') {
            this.SSID = SSID;
            this.BSSID = BSSID;
            this.frequency = frequency;
            this.level = level;
            this.timestamp = timestamp;
            this.capabilities = capabilities;
        } else {
            let iwlistOut = SSID;
            this.SSID = iwlistOut.SSID || iwlistOut.ssid || iwlistOut.ESSID || iwlistOut.essid;
            this.BSSID = iwlistOut.ADDRESS || iwlistOut.Address || iwlistOut.address || iwlistOut.BSSID || iwlistOut.bssid;
            this.frequency = (typeof iwlistOut.frequency === 'string') ? parseFloat(iwlistOut.frequency.split(' ')[0]) * 10 : iwlistOut.frequency;
            this.level = iwlistOut.level || iwlistOut.signalLevel;
            // TODO: maybe implement this sometime in the future?
            this.timestamp = 0;
            // TODO: maybe implement this sometime in the future?
            this.capabilities = iwlistOut.capabilities;
        }
    }
}
