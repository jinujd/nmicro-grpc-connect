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
}