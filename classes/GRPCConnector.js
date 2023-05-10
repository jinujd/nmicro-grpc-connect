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
    grpcConnectorOptions = new GRPCConnectorOptions()
    constructor(options =  DEFAULT_OPTIONS) {
        this.init(options)
    }
    init(options = DEFAULT_OPTIONS) {   
        this.grpcConnectorOptions = new GRPCConnectorOptions(options)
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
    connect(service = () => {}, serviceInfo = new Object()) {
        const {host, port} = serviceInfo
    }
    publish(service = () => {}, serviceInfo = new Object()) {
        this.service = service 
        const {host, port} = serviceInfo
        const server = this.getGrpcServer(host, port)
    }
    start(port, useSSL) {
        let credentials;
        if (useSSL) {
          const rootCert = fs.readFileSync('path/to/root_certificate.pem');
          const privateKey = fs.readFileSync('path/to/private_key.pem');
          const certChain = fs.readFileSync('path/to/certificate_chain.pem');
          credentials = grpc.ServerCredentials.createSsl(rootCert, [{ private_key: privateKey, cert_chain: certChain }], true);
        } else {
          credentials = grpc.ServerCredentials.createInsecure();
        }
      
        this.server.bindAsync(`0.0.0.0:${port}`, credentials, (error, port) => {
          if (error) {
            console.error('Failed to bind server:', error);
            return;
          }
          const protocol = useSSL ? 'HTTPS' : 'HTTP';
          console.log(`Server running at ${protocol} 0.0.0.0:${port}`);
          this.server.start();
        });
      }
}