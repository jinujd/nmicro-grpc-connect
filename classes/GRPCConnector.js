import grpc from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"
import {GRPCConnectorOptions, DEFAULT_OPTIONS} from "./GRPCConnectorOptions.js" 
import {isAsyncFunction} from "../utils/helpers.js"
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
    grpcService = null
    connectorOptions = new GRPCConnectorOptions()
    constructor(options =  DEFAULT_OPTIONS) {
        this.init(options)
    }
    
    init(options = DEFAULT_OPTIONS) {   
        this.connectorOptions = new GRPCConnectorOptions(options)
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, this.grpcOptions)
        this.grpcProto = grpc.loadPackageDefinition(packageDefinition).Service
        this.grpcService = this.grpcProto.service
    }
    getGrpcClient(host, port) { 
        this.grpcClient = this.grpcClient || new this.grpcService(`${host}:${port}`, grpc.credentials.createInsecure())
        return this.grpcClient
    }
    initGRPCServer() {
        if(!this.grpcServer) {
            this.grpcServer = new grpc.Server() 
            this.grpcServer.addService(this.grpcService, {
                CallFunction: this.callServiceFunction.bind(this),
            }) 
        }
        return this.grpcServer
    } 
    async callServiceFunction(call, callback) {
        const request = call.request
        const {functionName, parameters} = request
        const fn = !functionName? this.service: this.service[functionName]
        if(!fn) return callback(new Error(`Function '${functionName}' is not supported.`), null)
        const result = isAsyncFunction(fn)? await fn(...parameters): fn(...parameters)
        const response = { response: result }
        callback(null, response);
    }
    connect() {
        const {host, port} = this.connectorOptions
        const Service =  this.grpcProto;
        const credentials =  this.createGRPCServerCredentials()
        const endpoint = this.getGRPCEndpoint()
        this.grpcClient = new Service(endpoint, credentials)
    }
    call(functionName = "", parameters = [], serviceInfo = new Object()) {
        this.connect()
        const request = {functionName, parameters}
        return new Promise((resolve, reject) => {
            this.grpcClient.CallFunction(request, (error, response) => {
                if(error) return reject(error)
                resolve(response)
            })
        })
    }
    publish(service = () => {}, serviceInfo = new Object()) {
        this.service = service 
        const {host, port} = serviceInfo
        this.initGRPCServer(host, port) 
        const credentials =  this.createGRPCServerCredentials()
        const endpoint = this.getGRPCEndpoint()
        this.bindGRPCServer(endpoint, credentials)
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
        this.grpcServer.bindAsync(endpoint, credentials, (error) => {
            if (error) throw new Error('Failed to bind GRPC server', error)  
            this.grpcServer.start()
        })
    } 
}