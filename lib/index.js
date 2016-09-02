/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



/**
 * KarmiaRPC
 *
 * @class
 */
class KarmiaRPC {
    /**
     * Constructor
     *
     * @constructs KarmiaRPC
     * @returns {Object}
     */
    constructor(options) {
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
    set(key, value) {
        const self = this;

        let methods = {};
        if (key instanceof Object) {
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
    clear() {
        const self = this;
        self.methods = {};

        return self;
    }

    /**
     * Get method
     *
     * @param   {string} path
     * @returns {Function}
     */
    get(path) {
        const self = this;

        return (function method (object, path) {
            path = path || '';
            const properties = path.split('.'),
                result = object[properties[0]];
            if (result instanceof Object) {
                return (1 < properties.length) ? method(result, path.substring(path.indexOf('.') + 1)) : result;
            }

            return (1 < properties.length) ? undefined : result;
        })(self.methods, path);
    }

    /**
     * Call method
     *
     * @param   {Object} context
     * @param   {Object} body
     * @returns {*}
     */
    call(context, body) {
        const self = this;
        if (Array.isArray(body)) {
            return Promise.all(body.map(function (request) {
                return self.call(context, request).catch(function (error) {
                    return Promise.resolve(error);
                });
            }));
        }

        const method = body.method || '',
            params = body.params || {},
            func = self.get(method);
        if (method && !func) {
            const error = new Error('Not Found');
            error.code = 404;

            return Promise.reject(error);
        }

        return context.promise(func, Object.assign({params: params}, params));
    }
}



// Export modules
module.exports = function (options) {
    return new KarmiaRPC(options);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
