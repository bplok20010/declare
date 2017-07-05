const toString = Object.prototype.toString;

export function isFunction(obj) {
    return toString.call(obj) === '[object Function]';
}

export function isArray(obj) {
    return toString.call(obj) === '[object Array]';
}

export function isNullOrUndef(s) {
    return s === null || s === undefined;
}

export function isObject(s) {
    return toString.call(s) === '[object Object]';
}

export function assign(target) {
    if (Object.assign) {
        return Object.assign.apply(Object, arguments);
    }

    if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }

    var output = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
            for (var nextKey in source) {
                if (source.hasOwnProperty(nextKey)) {
                    output[nextKey] = source[nextKey];
                }
            }
        }
    }
    return output;
}