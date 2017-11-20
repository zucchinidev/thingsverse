'use strict'
const agentFixture = require('./agent')

const metric = {
  id: 1,
  type: 'a',
  value: '{data: "fakeData"}',
  createdAt: new Date(),
  UpdatedAt: new Date(),
  agentId: agentFixture.single.id
}

const metrics = [
  metric,
  extend(metric, {id: 2, type: 'a', value: '{data: "fakeData-2"}', agentId: 2}),
  extend(metric, {id: 3, type: 'b', value: 10, agentId: 3}),
  extend(metric, {id: 4, type: 'c', value: true, agentId: 4})
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  first: metric,
  all: metrics,
  getByTypeAgentId: (type, agentId) => metrics.filter(a => a.type === type && a.agentId === agentId)
}
