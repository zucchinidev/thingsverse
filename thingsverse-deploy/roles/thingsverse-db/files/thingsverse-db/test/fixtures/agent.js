'use strict'

const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'agentFixture',
  username: 'things',
  hostname: 'text-host',
  pid: 0,
  connected: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const agents = [
  agent,
  extend(agent, {id: 2, uuid: 'yyy-uuu-uuu', connected: false, pid: 2, username: 'test'}),
  extend(agent, {id: 3, uuid: 'yyy-uuu-vvv'}),
  extend(agent, {id: 4, uuid: 'yyy-uuu-xxx', username: 'test'})
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

const agentFixture = {
  single: agent,
  all: agents,
  connected: agents.filter(a => a.connected),
  things: agents.filter(a => a.username === 'things'),
  findByUuid: uuid => agents.filter(a => a.uuid === uuid).shift(),
  findById: id => agents.filter(a => a.id === id).shift()
}

module.exports = agentFixture
