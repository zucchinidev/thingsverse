const ThingsverseAgent = require('../')

const agent = new ThingsverseAgent({
  interval: 2000,
  name: 'myapp',
  username: 'admin'
})

agent.addMetric('rss', function getRss () {
  return process.memoryUsage().rss
})

agent.addMetric('promiseMetric', function getRandomPromise () {
  return Promise.resolve(Math.random())
})

agent.addMetric('callbackMetric', function getRandomCallback (callback) {
  setTimeout(() => callback(null, Math.random(), 2000))
})

// this agent only
agent.connect()
agent.on('connected', handler)
agent.on('disconnected', handler)
agent.on('message', handler)

// Other agents
agent.on('agent/connected', handler)
agent.on('agent/disconnected', handler)
agent.on('agent/message', payload => console.log(payload))

function handler (payload) {
  console.log(payload)
}

// setTimeout(() => agent.disconnect(), 20000)
