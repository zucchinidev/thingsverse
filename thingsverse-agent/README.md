# thingsverse-agent

## Usage

```js

const ThingsverseAgent = require('thingsverse-agent')

const agent = new ThingsverseAgent({
    interval: 2000
})

agent.connect()

agent.on('agent/message', payload => console.log(payload))


setTimeout(() => agent.disconnect(), 20000)

```