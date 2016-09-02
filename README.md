# karmia-rpc

RPC module of Karmia JavaScript library

## Installation

```Shell
npm install karmia-rpc
```

## Example

```JavaScript
const karmia_rpc = require('karmia-rpc'),
    methods = karmia_rpc();
```

### Define method
#### Key-Value style

```JavaScript
methods.set('method_name', function () {
});
```

#### Object style

```JavaScript
const methods_object = {
    method_namespace: {
        method_name: function () {
        }
    },
    method_other_namespace: {
        method_name: function () {
        }
    },
    method_name: function () {
    }
}
methods.set(methods_object);
```


### Get method

```JavaScript
// Top level
methods.get('method_name');

// Lower level
methods.get('method_namespace.method_name');
```


### Clear methods
```JavaScript
methods.clear();
```


### Call method
#### Single request

```JavaScript
const karmia_context = require('karmia-context'),
    context = karmia_context(),
    request = {
        method: 'method_name',
        params: {
            argument_1: 'value1',
            argument_2: 'value2'
        }
    };

const promise = methods.call(context, request);
```

#### Batch request

```JavaScript
const karmia_context = require('karmia-context'),
    context = karmia_context(),
    requests = [
        {
            method: 'method_name',
            params: {
                argument_1: 'value1',
                argument_2: 'value2'
            }
        }, {
            method: 'method_namespace.method_name'
        }
    ];

const promise_array = methods.call(context, requests);
```
