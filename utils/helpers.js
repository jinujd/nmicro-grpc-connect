export const throwErr = (msg) => new Error(msg) 
export const isAsyncFunction = (fn) => fn.constructor.name === 'AsyncFunction'