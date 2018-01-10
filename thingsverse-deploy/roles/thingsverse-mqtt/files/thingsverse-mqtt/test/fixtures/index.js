const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'fixture',
  username: 'things',
  hostname: 'text-host',
  pid: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}
const metric = { type: 'a', value: '{"data": "fakeData-2"}' }
const metrics = [metric, { type: 'b', value: 100 }]
const payload = { agent, metrics }
const stringPayload = JSON.stringify(payload)
const publisher = { id: '111' }
const stringAgent = JSON.stringify(agent)
const plainObjectAgent = JSON.parse(stringAgent)
module.exports = {
  agent,
  payload,
  stringPayload,
  publisher,
  stringAgent,
  plainObjectAgent,
  metrics,
  getMetricByType: (type) => metrics.filter(m => m.type === type).shift()
}
