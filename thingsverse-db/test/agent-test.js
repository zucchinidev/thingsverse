'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const agentFixtures = require('./fixtures/agent')

const single = Object.assign({}, agentFixtures.single)
const id = 1
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
    hasMany: sandbox.spy(),
    findById: sandbox.stub().withArgs(id).returns(Promise.resolve(agentFixtures.findById(id)))
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

test.serial('Agent#findById', async t => {
  const agent = await db.Agent.findById(id)
  t.true(AgentModelStub.findById.called, 'findById should be called on model')
  t.true(AgentModelStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentModelStub.findById.calledWith(id), 'findById should be called with specified id')
  t.deepEqual(agent, agentFixtures.findById(id), 'should be the same')
})
