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

const invalidAgent = {
  uuid: null
}

const payload = { agent, metrics: [] }
const stringPayload = JSON.stringify(payload)
const publisher = { id: '111' }
const stringAgent = JSON.stringify(agent)
const plainObjectAgent = JSON.parse(stringAgent)
module.exports = {
  agent,
  invalidAgent,
  payload,
  stringPayload,
  publisher,
  stringAgent,
  plainObjectAgent
}
