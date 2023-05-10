import {throwError} from "../utils/helpers.js"
export class SSLOptions { 
    rootCert = null 
    privateKey = null
    certChain = null 
    constructor(options = {rootCert: null, privateKey: null, certChain: null } ){
        const {rootCert, privateKey, certChain} = options
        this.rootCert = rootCert
        this.privateKey = privateKey
        this.certChain = certChain
    } 
    validate() {
        if(!this.rootCert) throwError(`rootCert is missing for SSLOptions`)
        if(!this.privateKey) throwError(`privateKey is missing for SSLOptions`)
        if(!this.certChain) throwError(`certChain is missing for SSLOptions`)
    }
}