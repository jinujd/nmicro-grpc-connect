import grpc from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"
import {GRPCConnectorOptions, DEFAULT_OPTIONS} from "./GRPCConnectorOptions.js" 
const PROTO_PATH = "../schemas/service.proto" 
export class GRPCConnector {
    service = {}
    grpcOptions = {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    }
    grpcProto = null
    grpcClient = null
    grpcServer = null
    connectorOptions = new GRPCConnectorOptions()
    constructor(options =  DEFAULT_OPTIONS) {
        this.init(options)
    }
    init(options = DEFAULT_OPTIONS) {   
        this.connectorOptions = new GRPCConnectorOptions(options)
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, this.grpcOptions)
        this.grpcProto = grpc.loadPackageDefinition(packageDefinition).Service
    }
    getGrpcClient(host, port) { 
        this.grpcClient = this.grpcClient || new this.grpcProto.Service(`${host}:${port}`, grpc.credentials.createInsecure())
        return this.grpcClient
    }
    getGrpcServer() {
        if(!this.grpcServer) {
            this.server = new grpc.Server() 
            this.server.addService(this.grpcProto.Service.service, {
                CallFunction: this.callFunction.bind(this),
            }) 
        }
        return this.grpcServer
    }
    callFunction(call, callback) {
        const request = call.request
        const {functionName, parameters} = request
        const fn = !functionName? this.service: this.service[functionName]
        if(!fn) return callback(new Error(`Function '${functionName}' is not supported.`), null)
        const result = fn(...parameters)
        const response = { response: result }
        callback(null, response);
    }
    connect(service = () => {}, serviceInfo = new Object()) {
        const {host, port} = serviceInfo
    }
    publish(service = () => {}, serviceInfo = new Object()) {
        this.service = service 
        const {host, port} = serviceInfo
        const server = this.getGrpcServer(host, port)
    }
    createGRPCServerCredentials() {
        let credentials;
        const {useSSL, SSLOptions: {rootCert, privateKey, certChain}} = this.connectorOptions 
        if (useSSL) {
          const rootCertData = fs.readFileSync(rootCert)
          const privateKeyData = fs.readFileSync(privateKey)
          const certChainData = fs.readFileSync(certChain)
          credentials = grpc.ServerCredentials.createSsl(rootCertData, [{ private_key: privateKeyData, cert_chain: certChainData }], true)
        } else {
          credentials = grpc.ServerCredentials.createInsecure()
        } 
        return credentials
    }
    getGRPCEndpoint() {
        const {host, port} = this.connectorOptions
        return `${host}:${port}`
    }
    bindGRPCServer(endpoint, credentials) {
        this.server.bindAsync(endpoint, credentials, (error) => {
            if (error) throw new Error('Failed to bind GRPC server', error)  
            this.server.start()
        })
    }
    start() {
        const credentials =  this.createGRPCServerCredentials()
        const endpoint = this.getGRPCEndpoint()
        this.bindGRPCServer(endpoint, credentials)
    }
}