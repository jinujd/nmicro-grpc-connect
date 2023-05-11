import path from 'path'
import { fileURLToPath } from 'url'
export const throwError = (msg) => new Error(msg) 
export const isAsyncFunction = (fn) => fn.constructor.name === 'AsyncFunction'
export const cwd = (fileUrl) =>{
    const __filename = fileURLToPath(fileUrl)
    const __dirname = path.dirname(__filename)
    return __dirname
}