'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { stringPayload, publisher, stringAgent, plainObjectAgent, getMetricByType, metrics } = require('./fixtures')

let module
let debug = null
let sandbox = null
let mqtt = null
const mockAgentService = {}
const mockMetricService = {}
const mqttModule = {}

const createOrUpdateArgs = Object.assign({}, plainObjectAgent, { connected: true })

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  debug = sandbox.spy()
  module = proxyquire('../src/mqtt', {
    'debug': () => debug
  })
  process.on = sandbox.stub()
  mqttModule.on = sandbox.spy()
  mqttModule.publish = sandbox.spy()
  mockMetricService.create = sandbox.stub()
  mockMetricService.create.withArgs(plainObjectAgent.uuid, getMetricByType('a')).returns(Promise.resolve({ id: '' }))
  mockMetricService.create.withArgs(plainObjectAgent.uuid, getMetricByType('b')).returns(Promise.resolve({ id: '' }))
  mockAgentService.createOrUpdate = sandbox.stub()
  mockAgentService.createOrUpdate.withArgs(createOrUpdateArgs).returns(Promise.resolve())
  mockAgentService.createOrUpdate.withArgs(Object.assign({}, plainObjectAgent, { connected: false })).returns(Promise.resolve())
  mqtt = module.startServer({
    mqttModule,
    agentService: mockAgentService,
    metricService: mockMetricService
  })
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('mqtt#constructor', t => {
  t.is(mqttModule.on.callCount, 4, 'Should subscribe to some events')
  const isMqttInstance = mqtt instanceof module.Mqtt
  t.truthy(isMqttInstance, 'Should create a new instance')
  t.truthy(mqtt.mqttModule, 'Should have a mqtt module')
  t.truthy(mqtt.agents, 'Should have a map of agents')
  const isMapInstance = mqtt.agents instanceof Map
  t.truthy(mqtt.agentService, 'Should have a agent service')
  t.true(isMapInstance, 'Should have a map of agents')
})

test('mqtt#onPublishedMessage connectedAgent && disconnectedAgent', t => {
  const cases = [
    { topic: module.Mqtt.topics().connectedAgent, payload: 'payload' },
    { topic: module.Mqtt.topics().disconnectedAgent, payload: 'payload' }
  ]
  cases.forEach((c) => {
    mqtt.onPublishedMessage(c, {})
    t.true(debug.called, `Should receive a message with the topic ${c.topic}`)
    t.true(debug.calledWith(`Payload: ${c.payload}`), `Should receive a message with the payload ${c.payload}`)
  })
})

test.serial('mqtt#onPublishedMessage topic not valid', async t => {
  const topic = 'fake topic'
  await mqtt.onPublishedMessage({ topic, payload: 'payload' }, {})
  t.true(debug.called, `Should receive a message with a invalid topic ${topic}`)
  t.true(debug.calledWith(`Topic not valid: ${topic}`), `Should receive a message with a invalid topic ${topic}`)
})

test.serial('mqtt#onPublishedMessage publish with topic: agentPublishesMessage', async t => {
  const { agentPublishesMessage: topic } = module.Mqtt.topics()
  const agentPublishesMessageStub = sinon.stub(mqtt, 'agentPublishesMessage')
  await mqtt.onPublishedMessage({ topic, payload: stringPayload }, publisher)

  t.true(agentPublishesMessageStub.called, 'Should publishes a message')
  t.true(agentPublishesMessageStub.calledWith(stringPayload, publisher), 'Should publishes a message')
  agentPublishesMessageStub.restore()
})

test.serial('mqtt#agentPublishesMessage publish message with the payload in string format and buffer format', async t => {
  const registerAgentStub = sinon.stub(mqtt, 'registerAgent')
  const storeMetricsStub = sinon.stub(mqtt, 'storeMetrics')
  const testCases = [{ payload: stringPayload }, { payload: Buffer.from(stringPayload) }]
  for (const testCase of testCases) {
    await mqtt.agentPublishesMessage(testCase.payload, publisher)
    t.true(debug.called, `Should debug a message`)
    t.true(registerAgentStub.calledWith({ agent: plainObjectAgent, publisher }), 'Should register an Agent')
    t.true(storeMetricsStub.calledWith({ metrics, uuid: plainObjectAgent.uuid }), 'Should store the metrics')
    storeMetricsStub.restore()
    registerAgentStub.restore()
  }
})

test.serial('mqtt#storeMetrics', async t => {
  await mqtt.storeMetrics({ metrics, uuid: plainObjectAgent.uuid })
  t.true(mockMetricService.create.called, 'Should create a metric')
  t.true(mockMetricService.create.calledWith(plainObjectAgent.uuid, getMetricByType('a')), 'Should create a metric')
  t.true(mockMetricService.create.calledWith(plainObjectAgent.uuid, getMetricByType('b')), 'Should create a metric')
})

test.serial('mqtt#registerAgent', async t => {
  const { connectedAgent: topic } = module.Mqtt.topics()
  const publishedMessage = { topic, payload: stringAgent }

  t.is(mqtt.agents.get('111'), undefined, 'initially we do not have connected agents')

  await mqtt.registerAgent({ publisher, agent: plainObjectAgent })

  t.true(mqtt.agentService.createOrUpdate.calledWith(createOrUpdateArgs))
  t.deepEqual(mqtt.agents.get('111'), plainObjectAgent, 'after we have a connected agent')
  t.true(mqttModule.publish.called, 'Should post a message for the connected agent')
  t.true(mqttModule.publish.calledWith(publishedMessage), 'Should post a message for the connected agent')
})

test.serial('mqtt#onClientConnected', t => {
  mqtt.onClientConnected({ id: '22' })
  t.true(debug.called, 'Should log a connected client')
  t.is(mqtt.agents.size, 1, 'Should exists a stored agent')
  mqtt.agents.clear()
})

test.serial('Mqtt#onClientDisconnected', async t => {
  const { disconnectedAgent: topic } = module.Mqtt.topics()
  const payload = JSON.stringify({ agent: { uuid: plainObjectAgent.uuid } })
  const publishedMessage = { topic, payload }
  mqtt.agents.set('22', plainObjectAgent)
  const client = { id: '22' }

  await mqtt.onClientDisconnected(client)
  t.true(debug.called, 'Should log a disconnected client')
  t.is(mqtt.agents.get('22'), undefined, 'Should remove the agent of the list of agents')
  t.true(mqttModule.publish.called, 'Should post a message to notify the disconnected agent')
  t.true(mqttModule.publish.calledWith(publishedMessage), 'Should post a message for the connected agent')
  t.true(debug.calledWith(`Client with id: ${client.id} associated to Agent (${plainObjectAgent.uuid}) marked as disconnected`), 'Should show a message to notify the disconnected agent')
})

test.serial('Mqtt#onClientDisconnected with invalid agent', async t => {
  mqtt.agentService = {
    createOrUpdate () {}
  }
  const createOrUpdateStub = sinon.stub(mqtt.agentService, 'createOrUpdate')
  createOrUpdateStub.withArgs({ connected: false }).returns(Promise.reject(new Error('')))
  const mock = sinon.stub(module.Mqtt, 'handleError')
  mqtt.agents.set('33', {})
  const client = { id: '33' }
  await mqtt.onClientDisconnected(client)
  t.deepEqual(mqtt.agents.get('33'), { connected: false }, 'Should does not remove the agent of the list of agents')
  t.true(createOrUpdateStub.called, 'Should try to modify the agent')
  t.true(mock.called, 'Should log an error message')
  mock.restore()
  createOrUpdateStub.restore()
  mqtt.agents.delete('33')
})

test('Mqtt#isConnectedAgent', t => {
  const topic = module.Mqtt.topics().connectedAgent
  const result = module.Mqtt.isConnectedAgent(topic)
  t.true(result, 'Should check if the topic has the value agent connected')
})

test('Mqtt#isDisconnectedAgent', t => {
  const topic = module.Mqtt.topics().disconnectedAgent
  const result = module.Mqtt.isDisconnectedAgent(topic)
  t.true(result, 'Should check if the topic has the value agent disconnected')
})

test('Mqtt#isAgentPublishesMessage', t => {
  const topic = module.Mqtt.topics().agentPublishesMessage
  const result = module.Mqtt.isAgentPublishesMessage(topic)
  t.true(result, 'Should check if the topic has the value agent publish a message')
})

test('Mqtt#topics', t => {
  const availableMessages = module.Mqtt.topics()
  t.deepEqual(availableMessages, {
    connectedAgent: 'agent/connected',
    disconnectedAgent: 'agent/disconnected',
    agentPublishesMessage: 'agent/message'
  }, 'Should check the topics allowed')
})

test('Mqtt#handleError', t => {
  const consoleStub = sinon.stub(console, 'error')
  module.Mqtt.handleError({ stack: '', message: '' })
  t.true(consoleStub.called)
  t.true(consoleStub.calledTwice)
  consoleStub.restore()
})

test('Mqtt#handleFatalError', t => {
  const exit = sinon.stub(process, 'exit')
  const consoleStub = sinon.stub(console, 'error')

  module.Mqtt.handleFatalError({ stack: '', message: '' })
  t.true(consoleStub.called)
  t.true(consoleStub.calledTwice)
  t.true(exit.called)
  t.true(exit.calledOnce)
  exit.restore()
  consoleStub.restore()
})
