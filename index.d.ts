import KarmiaContext = require("karmia-context");

declare class KarmiaRPC {
    methods: object;

    constructor(options: object);
    set(key: object|string, value?:Function|object): KarmiaRPC;
    clear(): KarmiaRPC;
    get(path?: string): Function|object;
    call(context: KarmiaContext, body:Array<object>|object): Promise<any>;
}
