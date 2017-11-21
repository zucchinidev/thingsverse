const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const agentFixture = require('./fixtures/agent')
const metricFixture = require('./fixtures/metric')
let sandbox = null
let db = null
let metricByTypeAgentId = null
let returnedMetric = null
const agentUuid = agentFixture.single.uuid

const config = {
  logging: () => {}
}

const MetricModelStub = {
  belongsTo: sinon.spy()
}

const AgentModelStub = {
  hasMany: sinon.spy()
}

const findByAgentUuidCondition = {
  attributes: ['type'],
  group: ['type'],
  include: [{
    attributes: [],
    model: AgentModelStub,
    where: {
      uuid: agentUuid
    }
  }],
  raw: true
}

const findByTypeAgentUuidCondition = {
  attributes: ['id', 'type', 'value', 'createdAt'],
  where: {
    type: 'a'
  },
  limit: 20,
  order: [['createdAt', 'DESC']],
  include: [{
    attributes: [],
    model: AgentModelStub,
    where: {
      uuid: agentUuid
    }
  }],
  raw: true
}

const createCondition = {
  where: { uuid: agentUuid }
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  MetricModelStub.findAll = sandbox.stub()
  MetricModelStub.findAll.withArgs(findByAgentUuidCondition).returns(Promise.resolve([{
    type: metricFixture.first.type
  }]))

  const { id, type, value, createdAt } = metricFixture.getByTypeAgentId(findByTypeAgentUuidCondition.where.type, 1)
  metricByTypeAgentId = { id, type, value, createdAt }

  MetricModelStub.findAll
    .withArgs(findByTypeAgentUuidCondition)
    .returns(Promise.resolve([metricByTypeAgentId]))

  AgentModelStub.findOne = sandbox.stub().withArgs(createCondition).returns(Promise.resolve(agentFixture.single))

  returnedMetric = Object.assign({}, metricFixture.first, { agentId: agentFixture.single.id })

  const createdMetric = {
    toJSON: sandbox.stub().returns(returnedMetric)
  }

  MetricModelStub.create = sandbox.stub()
    .withArgs(returnedMetric)
    .returns(Promise.resolve(createdMetric))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentModelStub,
    './models/metric': () => MetricModelStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('Metric', t => {
  t.truthy(db.Metric, 'Metric service should exists')
})

test.serial('Setup', t => {
  t.true(AgentModelStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentModelStub.hasMany.calledWith(MetricModelStub), 'Argument should be the MetricModel')
  t.true(MetricModelStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricModelStub.belongsTo.calledWith(AgentModelStub), 'Argument should be the AgentModel')
})

test.serial('Metric#findByAgentUuid', async t => {
  const metrics = await db.Metric.findByAgentUuid(agentUuid)
  t.true(MetricModelStub.findAll.called, 'findAll should be called on model')
  t.true(MetricModelStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricModelStub.findAll.calledWith(findByAgentUuidCondition), 'findAll should be called with specified id')
  t.deepEqual(metrics, [{ type: metricFixture.first.type }], 'should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  const metrics = await db.Metric.findByTypeAgentUuid(findByTypeAgentUuidCondition.where.type, agentUuid)
  t.true(MetricModelStub.findAll.called, 'findAll should be called on model')
  t.true(MetricModelStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricModelStub.findAll.calledWith(findByTypeAgentUuidCondition), 'findAll should be called with specified id')
  t.deepEqual(metrics, [metricByTypeAgentId], 'should be the same')
})

test.serial('Metric#create', async t => {
  const created = await db.Metric.create(agentUuid, metricFixture.first)
  t.true(AgentModelStub.findOne.called, 'findOne should be called on model')
  t.true(AgentModelStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentModelStub.findOne.calledWith(createCondition), 'findAll should be called with specified uuid')
  t.deepEqual(created, returnedMetric, 'should be the same')
})
