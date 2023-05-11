import path from 'path'
import {
    fileURLToPath
} from 'url'
export const throwError = (msg) => new Error(msg)
export const isFunction = (obj) => typeof obj === `function`
export const isAsyncFunction = (fn) => fn.constructor.name === 'AsyncFunction'
export const cwd = (fileUrl) => {
    const __filename = fileURLToPath(fileUrl)
    const __dirname = path.dirname(__filename)
    return __dirname
}
export const getKeyTypesAndValues = (obj) => {
    if (Array.isArray(obj)) {
        return {
            type: 'array',
            value: obj.map((value) => {
                if (Array.isArray(value)) {
                    return getKeyTypesAndValues(value);
                } else if (typeof value === 'object') {
                    return {
                        type: 'object',
                        value: Object.entries(value).map(([key, val]) => ({
                            key,
                            ...getKeyTypesAndValues(val),
                        })),
                    };
                } else {
                    return {
                        type: typeof value,
                        value,
                    };
                }
            }),
        };
    } else if (typeof obj === 'object') {
        return {
            type: 'object',
            value: Object.entries(obj).map(([key, value]) => ({
                key,
                ...getKeyTypesAndValues(value),
            })),
        };
    } else {
        return {
            type: typeof obj,
            value: obj,
        };
    }
}
export const createArgumentFromResult = (result) => {
    if (result.type === 'array') {
        return result.value.map((value) => {
            if (value.type === 'array') {
                return createArgumentFromResult(value);
            } else if (value.type === 'object') {
                const obj = {};
                value.value.forEach((entry) => {
                    obj[entry.key] = createArgumentFromResult(entry);
                });
                return obj;
            } else {
                return value.value;
            }
        });
    } else if (result.type === 'object') {
        const obj = {};
        result.value.forEach((entry) => {
            obj[entry.key] = createArgumentFromResult(entry);
        });
        return obj;
    } else {
        return result.value;
    }
}