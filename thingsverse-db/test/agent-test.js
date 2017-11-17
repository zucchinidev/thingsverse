'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

let db = null
let sandbox = null
const config = {
  logging: () => {}
}

const MetricModelStub = {
  belongsTo: sinon.spy()
}

let AgentModelStub = null

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentModelStub = {
    hasMany: sandbox.spy()
  }
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentModelStub,
    './models/metric': () => MetricModelStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exists')
})

test.serial('Setup', t => {
  t.true(AgentModelStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentModelStub.hasMany.calledWith(MetricModelStub), 'Argument should be the MetricModel')
  t.true(MetricModelStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricModelStub.belongsTo.calledWith(AgentModelStub), 'Argument should be the AgentModel')
})
