import {throwError} from "../utils/helpers.js"
import { SSLOptions } from "./SSLOptions.js"
export const DEFAULT_HOST = `localhost`
export const DEFAULT_PORT = 9090
export const USE_SSL_DEFAULT = false
export const DEFAULT_SSL_OPTIONS = new SSLOptions()
export const DEFAULT_OPTIONS = {useSSL: USE_SSL_DEFAULT, SSLOptions: DEFAULT_SSL_OPTIONS, host: DEFAULT_HOST, DEFAULT_PORT }
export class GRPCConnectorOptions {
    useSSL = USE_SSL_DEFAULT 
    host = DEFAULT_HOST
    port = DEFAULT_PORT
    SSLOptions = DEFAULT_SSL_OPTIONS  
    constructor(options = DEFAULT_OPTIONS) {
        const {useSSL, SSLOptions, host, port} = options
        this.useSSL = useSSL
        this.SSLOptions = SSLOptions
        this.host = host 
        this.port = port
        this.validate()
    }
    validate() {
        if(!this.host) throwError(`host is missing for GRPCConnectorOptions`)
        if(!this.port) throwError(`port is missing for GRPCConnectorOptions`)
        if(this.useSSL) {
            if(!this.SSLOptions) throwError(`SSLOptions is missing for GRPCConnectorOptions`)
            this.SSLOptions.validate()
        }

    }
}