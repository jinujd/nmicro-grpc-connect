import { SSLOptions } from "./SSLOptions.js"
export const DEFAULT_HOST = `localhost`
export const DEFAULT_PORT = 9090
export const USE_SSL_DEFAULT = false
export const DEFAULT_OPTIONS = {useSSL: USE_SSL_DEFAULT, SSLOptions: new SSLOptions(), host: DEFAULT_HOST, DEFAULT_PORT }
export class GRPCConnectorOptions {
    useSSL = USE_SSL_DEFAULT 
    host = DEFAULT_HOST
    port = DEFAULT_PORT
    SSLOptions = new SSLOptions()  
    constructor(options = DEFAULT_OPTIONS) {
        const {useSSL, SSLOptions, host, port} = options
        this.useSSL = useSSL
        this.SSLOptions = SSLOptions
        this.host = host 
        this.port = port
    }
}