import grpc from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"
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
    constructor() {
        this.init()
    }
    init() {   
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, this.grpcOptions)
        this.grpcProto = grpc.loadPackageDefinition(packageDefinition).Service
    }
    getGrpcClient(host, port) { 
        this.grpcClient = this.grpcClient || new this.grpcProto.Service(`${host}:${port}`, grpc.credentials.createInsecure())
        return this.grpcClient
    }
    getGrpcServer(host, port) {
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
    connect(service = () => {}) {
        
    }
    publish(service = () => {}) {
        this.service = service 
    }
}