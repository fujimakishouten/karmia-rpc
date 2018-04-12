/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Import modules
import KarmiaContext = require("karmia-context");
import KarmiaRPC = require("../");


// Variables
const expect = require("expect.js");
let context: KarmiaContext;
let methods: KarmiaRPC;

// Declarations
declare class KarmiaRPCError extends Error {
    code?: number;
}

// Before each
beforeEach(function () {
    context = new KarmiaContext();
    methods = new KarmiaRPC();
});


// Test
describe('karmia-rpc', function () {
    describe('set', function () {
        describe('Should set method', function () {
            it('Key-Value', function () {
                const name = 'TEST_METHOD',
                    method = function () {};
                methods.set(name, method);

                expect(methods.methods[name]).to.eql(method);
            });

            it('Object', function () {
                const method = {
                    TEST_METHOD: function () {}
                };
                methods.set(method);

                expect(methods.methods).to.eql(method);
            });

            it('Multi methods', function () {
                const method = {
                    TEST_METHOD_1: function () {},
                    TEST_METHOD_2: function () {}
                };
                methods.set(method);

                expect(methods.methods).to.eql(method);
            });
        });

        it('Should append method', function () {
            const method = {
                    TEST_METHOD: function () {}
                },
                name = 'TEST_METHOD_APPEND',
                append = {} as {[index: string]: any};
            append[name] = function () {};

            methods.set(method);
            methods.set(name, append[name]);

            expect(methods.methods).to.eql(Object.assign(method, append));
        });

        it('Should merge methods', function () {
            const method1 = {
                    TEST_METHOD_1: function () {}
                },
                method2 = {
                    TEST_METHOD_2: function () {}
                };
            methods.set(method1);
            methods.set(method2);

            expect(methods.methods).to.eql(Object.assign(method1, method2));
        });
    });

    describe('get', function () {
        describe('Should get method', function () {
            it('Top level', function () {
                const method = {
                    LEVEL_1: function () {}
                };
                methods.set(method);

                expect(methods.get('LEVEL_1')).to.eql(method.LEVEL_1);
            });

            it('Lower level', function () {
                const method = {
                    LEVEL_1: {
                        LEVEL_2: {
                            LEVEL_3: function () {}
                        }
                    }
                };
                methods.set(method);

                expect(methods.get('LEVEL_1.LEVEL_2.LEVEL_3')).to.eql(method.LEVEL_1.LEVEL_2.LEVEL_3);
            });
        });

        describe('Should not get method', function () {
            it('Not found', function () {
                const method = {
                    TEST_METHOD: function () {}
                };
                methods.set(method);

                expect(methods.get('not_found')).to.be(undefined);
            });
        });
    });

    describe('clear', function () {
        it('Should clear methods', function () {
            const method = {
                TEST_METHOD: function () {}
            };
            methods.set(method);
            expect(methods.methods).to.eql(method);

            methods.clear();
            expect(methods.methods).to.eql({});
        });
    });

    describe('call', function () {
        describe('Should call method', function () {
            it('Single request', function (done) {
                const name = 'TEST_METHOD',
                    method = {} as {[index: string]: any},
                    body = {
                        method: name,
                        params: {
                            value1: 1,
                            value2: 2
                        }
                    };
                method[name] = function (value1: number, value2: number): number {
                    return value1 + value2;
                };

                methods.set(method);
                methods.call(context, body).then(function (result: number) {
                    expect(result).to.be(body.params.value1 + body.params.value2);

                    done();
                });
            });

            describe('Batch request', function () {
                it('All request success', function (done) {
                    const name = 'TEST_METHOD',
                        method = {} as {[index: string]: any},
                        body = [
                            {
                                method: name,
                                params: {
                                    value1: 1,
                                    value2: 2
                                }
                            }, {
                                method: name,
                                params: {
                                    value1: 2,
                                    value2: 3
                                }
                            }
                        ];
                    method[name] = function (value1: number, value2: number) {
                        return value1 + value2;
                    };

                    methods.set(method);
                    methods.call(context, body).then(function (result: Array<number>) {
                        body.forEach(function (data, index) {
                            expect(result[index]).to.be(data.params.value1 + data.params.value2);
                        });

                        done();
                    });
                });

                it('Some request fail', function (done) {
                    const name = 'TEST_METHOD',
                        method = {} as {[index: string]: any},
                        body = [
                            {
                                method: name,
                                params: {
                                    value1: 1,
                                    value2: 2
                                }
                            }, {
                                method: 'TEST_METHOD_NOT_FOUND'
                            }
                        ];
                    method[name] = function (value1: number, value2: number) {
                        return value1 + value2;
                    };

                    methods.set(method);
                    methods.call(context, body).then(function (result: Array<Error|number>) {
                        const error = result.find(function (value) {
                            return (value instanceof Error);
                        }) as KarmiaRPCError;

                        expect(error.code).to.be(404);
                        expect(error.message).to.be('Not Found');

                        done();
                    });
                });
            });
        });

        describe('Should be error', function () {
            it('Method not specified', function (done) {
                const body = {};
                methods.call(context, body).catch(function (error: KarmiaRPCError) {
                    expect(error.code).to.be(404);
                    expect(error.message).to.be('Not Found');

                    done();
                });
            });

            it('Method not found', function (done) {
                const body = {method: 'TEST_METHOD_NOT_FOUND'};
                methods.call(context, body).catch(function (error: KarmiaRPCError) {
                    expect(error.code).to.be(404);
                    expect(error.message).to.be('Not Found');

                    done();
                });
            });

            it('Method return error', function (done) {
                const name = 'TEST_METHOD_ERROR',
                    method = {} as {[index: string]: any},
                    body = {method: name},
                    code = 500,
                    message = 'TEST_ERROR_MESSAGE';
                method[name] = function () {
                    const error = new Error(message) as KarmiaRPCError;
                    error.code = code;

                    return Promise.reject(error);
                };

                methods.set(method);
                methods.call(context, body).catch(function (error: KarmiaRPCError) {
                    expect(error.code).to.be(code);
                    expect(error.message).to.be(message);

                    done();
                });
            });
        });
    });
});


/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

