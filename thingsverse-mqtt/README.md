# thingsverse-mqtt


## `agent/connected`

```js
{
    agent: {
        uuid, // autogenerated
        username, // configuration
        name,  // configuration
        hotname, // from SO
        pid // from proccess
    }
}
```

## `agent/disconnected`

```js
{
    agent: {
        uuid
    }
}
```


## `agent/message`

```js

{
    agent: {
        uuid, // autogenerated
        username, // configuration
        name,  // configuration
        hostname, // from SO
        pid // from proccess
    },
    metrics: [
        {
            type,
            value
        }
    ],
    timestamp, // created at the time of message sending
}

```

### Send test message

```sh
npm i --save -g mqtt

mqtt pub -t 'agent/message' -h localhost -m 'hello mqtt server'


  [thingsverse-mqtt] server is running
  thingsverse:mqtt Client Connected mqttjs_7e06717d +0ms
  thingsverse:mqtt Received: $SYS/bTgPcyq/new/clients +3ms
  thingsverse:mqtt Payload: mqttjs_7e06717d +0ms
  thingsverse:mqtt Client Disconnected mqttjs_7e06717d +3ms
  thingsverse:mqtt Received: agent/message +1ms
  thingsverse:mqtt Payload: hello mqtt server +0ms
  thingsverse:mqtt Received: $SYS/bTgPcyq/disconnect/clients +1ms
  thingsverse:mqtt Payload: mqttjs_7e06717d +0ms


```