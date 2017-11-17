'use strict'

const test = require('ava')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const agentFixtures = require('./fixtures/agent')

const single = Object.assign({}, agentFixtures.single)
const id = 1
const uuid = 'yyy-yyy-yyy'
const uuidArgs = {
  where: { uuid }
}

const connectedArgs = {
  where: { connected: true }
}

const usernameArgs = {
  where: { username: 'things', connected: true }
}

const newAgent = {
  uuid: '111-111-111',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

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
    findById: sandbox.stub().withArgs(id).returns(Promise.resolve(agentFixtures.findById(id))),
    update: sandbox.stub().withArgs(single, uuidArgs).returns(Promise.resolve(single)),
    create: sandbox.stub().withArgs(newAgent).returns(Promise.resolve({
      toJSON () { return newAgent }
    }))
  }
  AgentModelStub.findOne = sandbox.stub()
  AgentModelStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.findByUuid(uuid)))
  AgentModelStub.findOne.withArgs({
    where: { uuid: newAgent.uuid }
  }).returns(Promise.resolve(agentFixtures.findByUuid(newAgent.uuid)))

  AgentModelStub.findAll = sandbox.stub()
  AgentModelStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentModelStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))
  AgentModelStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.things))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentModelStub,
    './models/metric': () => MetricModelStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
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

test.serial('Agent#createOrUpdate - agent exists', async t => {
  const agent = await db.Agent.createOrUpdate(single)
  t.true(AgentModelStub.findOne.called, 'should be called on model')
  t.true(AgentModelStub.findOne.calledTwice, 'should be called twice')
  t.true(AgentModelStub.update.calledOnce, 'should be called once')
  t.deepEqual(agent, single, 'agent should be the same')
})

test.serial('Agent#createOrUpdate - new agent', async t => {
  const agent = await db.Agent.createOrUpdate(newAgent)
  t.true(AgentModelStub.findOne.called, 'should be called on model')
  t.true(AgentModelStub.findOne.calledOnce, 'should be called once')
  t.true(AgentModelStub.findOne.calledWith({
    where: { uuid: newAgent.uuid }
  }), 'findOne should be called with uuid args')
  t.true(AgentModelStub.create.called, 'should be called on model')
  t.true(AgentModelStub.create.calledOnce, 'should be called once')
  t.true(AgentModelStub.create.calledWith(newAgent), 'should be called once')
  t.deepEqual(agent, newAgent, 'agent should be the same')
})

test.serial('Agent#findConnected', async t => {
  const agents = await db.Agent.findConnected()
  t.true(AgentModelStub.findAll.called, 'should be called on model')
  t.true(AgentModelStub.findAll.calledOnce, 'should be called once')
  t.true(AgentModelStub.findAll.calledWith(connectedArgs), 'findAll should be called with connectedArgs args')
  t.is(agents.length, agentFixtures.connected.length, 'agents should be the same number')
  t.deepEqual(agents, agentFixtures.connected, 'agents should be the same')
})

test.serial('Agent#findAll', async t => {
  const agents = await db.Agent.findAll()
  t.true(AgentModelStub.findAll.called, 'should be called on model')
  t.true(AgentModelStub.findAll.calledOnce, 'should be called once')
  t.true(AgentModelStub.findAll.calledWith(), 'findAll should be called without arguments')
  t.is(agents.length, agentFixtures.all.length, 'agents should be the same number')
  t.deepEqual(agents, agentFixtures.all, 'agents should be the same')
})

test.serial('Agent#findByUserName', async t => {
  const agents = await db.Agent.findByUsername('things')
  t.true(AgentModelStub.findAll.called, 'should be called on model')
  t.true(AgentModelStub.findAll.calledOnce, 'should be called once')
  t.true(AgentModelStub.findAll.calledWith(usernameArgs), 'findAll should be called with usernameArgs arguments')
  t.is(agents.length, agentFixtures.things.length, 'agents should be the same number')
  t.deepEqual(agents, agentFixtures.things, 'agents should be the same')
})
