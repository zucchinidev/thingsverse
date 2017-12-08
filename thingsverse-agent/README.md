# thingsverse-agent

## Usage

```js

const ThingsverseAgent = require('thingsverse-agent')

const agent = new ThingsverseAgent({
    interval: 2000
})

agent.connect()
agent.on('connected') // self
agent.on('disconnected') // self
agent.on('message') // self


agent.on('agent/connected') // other agents
agent.on('agent/disconnected') // other agents
agent.on('agent/message', payload => console.log(payload)) // other agents


setTimeout(() => agent.disconnect(), 20000)

```