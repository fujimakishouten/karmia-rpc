/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
import events = require("events");
import KarmiaContext = require("karmia-context");

// Declarations
declare interface Methods {
    [index: string]: Function|object;
}

declare interface Parameters {
    [index: string]: any;
}

declare class KarmiaRPCError extends Error {
    code?: number;
}


/**
 * KarmiaRPC
 *
 * @class
 */
class KarmiaRPC extends events.EventEmitter {
    /**
     * Properties
     */
    public methods: Methods;

    /**
     * Constructor
     *
     * @constructs KarmiaRPC
     * @returns {Object}
     */
    constructor(options?: Methods) {
        super();

        const self = this;
        self.methods = {};

        return self.set(options || {});
    }

    /**
     * Set methods
     *
     * @param   {string} key
     * @param   {Function|Object} value
     * @returns {Object}
     */
    set(key: Methods|string, value?: Methods|Function): KarmiaRPC {
        const self = this;

        let methods = {} as Methods;
        if ('object' === typeof key) {
            methods = Object.assign(methods, key);
        } else {
            methods[key] = value;
        }

        self.methods = Object.assign(self.methods, methods);

        return self;
    }

    /**
     * Clear methods
     *
     * @returns {Object}
     */
    clear(): KarmiaRPC {
        const self = this;
        self.methods = {};

        return self;
    }

    /**
     * Get method
     *
     * @param   {string} [path]
     * @returns {Function}
     */
    get(path?: string): Function|Methods|undefined {
        const self = this;
        function method (object: Methods, path?: string): Function|Methods|undefined {
            path = path || '';
            const properties = path.split('.'),
                result = object[properties[0]] as Methods;
            if ('object' === typeof result) {
                return (1 < properties.length) ? method(result, path.substring(path.indexOf('.') + 1)) : result;
            }

            return (1 < properties.length) ? undefined : result;
        }

        return method(self.methods, path);
    }

    /**
     * Call method
     *
     * @param   {Object} context
     * @param   {Object} body
     * @returns {*}
     */
    call(context: KarmiaContext, body: Parameters): any {
        const self = this;
        if (Array.isArray(body)) {
            return Promise.all(body.map(function (request) {
                return self.call(context, request).catch(function (error: Error) {
                    return Promise.resolve(error);
                });
            }));
        }

        const method = body.method || '',
            params = body.params || {},
            func = self.get(method) as Function;
        if (!func) {
            const error = new Error('Not Found') as KarmiaRPCError;
            error.code = 404;

            return Promise.reject(error);
        }

        return context.promise(func, Object.assign({params: params}, params));
    }
}



// Export modules
export = KarmiaRPC;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
