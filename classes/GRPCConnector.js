import grpc, { credentials } from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"
import protobuf from 'protobufjs'
import path from 'path'
import {GRPCConnectorOptions, DEFAULT_OPTIONS} from "./GRPCConnectorOptions.js" 
import {isAsyncFunction, cwd} from "../utils/helpers.js"    
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
    packageDefinition = null
    connectorOptions = new GRPCConnectorOptions()
    constructor(options =  DEFAULT_OPTIONS) {
        this.init(options)
    }
    
    init(options = DEFAULT_OPTIONS) {   
        this.connectorOptions = new GRPCConnectorOptions(options) 
        
        this.packageDefinition = protoLoader.loadSync(path.resolve(cwd(import.meta.url), '..', 'schemas', 'service.proto'), this.grpcOptions)
        this.grpcProto = grpc.loadPackageDefinition(this.packageDefinition).Service
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
        console.log(`Responding with result`, response)
        callback(null, response);
    }
    connect() { 
        const Service =  this.grpcProto;
        const credentials =  this.createGRPCClientCredentials()
        console.log(credentials.constructor.name)
        const endpoint = this.getGRPCEndpoint() 
        this.grpcClient = new Service(endpoint, credentials)
    }
    decodeServiceResponse(response) {
        const anyValue = response.response;
        const decodedResult = Response.decode(anyValue);
        const result = Response.toObject(decodedResult, {
          longs: String,
          enums: String,
          bytes: Buffer,
        });
        return result;
        return result;
      }
    call(functionName = "", parameters = [], serviceInfo = new Object()) {
        this.connect()
        const request = {functionName, parameters}
        return new Promise((resolve, reject) => {
            this.grpcClient.CallFunction(request, (error, response) => {
                if(error) return reject(error)
                try { 
                    resolve(this.decodeServiceResponse(response))
                } catch(err) {
                    reject(err)
                }
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
    getGRPCCredentrialsObject() {

    } 
    setupGRPCCredentials(grpcCredentials) { 
        const {useSSL, SSLOptions: {rootCert, privateKey, certChain}} = this.connectorOptions 
        if(!useSSL) return grpcCredentials.createInsecure() 
        
        const rootCertData = fs.readFileSync(rootCert)
        const privateKeyData = fs.readFileSync(privateKey)
        const certChainData = fs.readFileSync(certChain)
        return grpcCredentials.createSsl(rootCertData, [{ private_key: privateKeyData, cert_chain: certChainData }], true)
        
    }
    createGRPCServerCredentials() {
        return this.setupGRPCCredentials(grpc.ServerCredentials) 
    }
    createGRPCClientCredentials() { 
        return this.setupGRPCCredentials(grpc.credentials)  
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