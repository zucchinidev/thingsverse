'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { agent, invalidAgent } = require('./fixtures')

let module
let debug = null
let sandbox = null
let mqtt = null
let mockAgentService = null
const mqttModule = {}

const invalidArgs = Object.assign({}, invalidAgent, { connected: true })
const validArgs = Object.assign({}, agent, { connected: true })

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  debug = sandbox.spy()
  module = proxyquire('../mqtt', {
    'debug': () => debug
  })
  process.on = sandbox.stub()
  mqttModule.on = sandbox.spy()
  mqttModule.publish = sandbox.spy()
  mockAgentService = sandbox.stub()
  mockAgentService.createOrUpdate = sandbox.stub()
  mockAgentService.createOrUpdate.withArgs(validArgs).returns(Promise.resolve())
  mqtt = module.startServer({
    mqttModule,
    agentService: mockAgentService
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
    { topic: module.Mqtt.getTopicsAllowed().connectedAgent, payload: 'payload' },
    { topic: module.Mqtt.getTopicsAllowed().disconnectedAgent, payload: 'payload' }
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

test('mqtt#onPublishedMessage publish message', async t => {
  const registerAgentStub = sinon.stub(mqtt, 'registerAgent')
  const payload = { agent, metrics: [] }
  await mqtt.onPublishedMessage({
    topic: module.Mqtt.getTopicsAllowed().agentPublishesMessage,
    payload: JSON.stringify(payload)
  }, { id: '111' })

  t.true(registerAgentStub.called, 'Should register an agent')
  registerAgentStub.restore()
})

test.serial('mqtt#registerAgent register agent with the payload in string format', async t => {
  const topicsAllowed = module.Mqtt.getTopicsAllowed()
  const payload = { agent, metrics: [] }
  const args = JSON.stringify(validArgs)
  const publishedMessage = { topic: topicsAllowed.connectedAgent, payload: JSON.stringify(agent) }
  const plainObjectAgent = JSON.parse(JSON.stringify(agent))
  const stringPayload = JSON.stringify(payload)

  t.is(mqtt.agents.get('111'), undefined, 'initially we do not have connected agents')

  await mqtt.registerAgent({
    publisher: { id: '111' },
    payload: stringPayload
  })

  t.true(mqtt.agentService.createOrUpdate.calledWith(JSON.parse(args)))
  t.deepEqual(mqtt.agents.get('111'), plainObjectAgent, 'after we have a connected agent')
  t.true(mqttModule.publish.called, 'Should post a message for the connected agent')
  t.true(mqttModule.publish.calledWith(publishedMessage), 'Should post a message for the connected agent')
})

test.serial('mqtt#registerAgent register agent with the payload as a buffer', async t => {
  const topicsAllowed = module.Mqtt.getTopicsAllowed()
  const payload = { agent, metrics: [] }
  const args = JSON.stringify(validArgs)
  const publishedMessage = { topic: topicsAllowed.connectedAgent, payload: JSON.stringify(agent) }
  const plainObjectAgent = JSON.parse(JSON.stringify(agent))
  const stringPayload = JSON.stringify(payload)
  t.is(mqtt.agents.get('111'), undefined, 'initially we do not have connected agents')

  const buffer = Buffer.from(stringPayload)
  await mqtt.registerAgent({
    publisher: { id: '111' },
    payload: buffer
  })
  t.true(mqtt.agentService.createOrUpdate.calledWith(JSON.parse(args)))
  t.deepEqual(mqtt.agents.get('111'), plainObjectAgent, 'after we have a connected agent')
  t.true(mqttModule.publish.called, 'Should post a message for the connected agent')
  t.true(mqttModule.publish.calledWith(publishedMessage), 'Should post a message for the connected agent')
})

test.serial('mqtt#registerAgent with not valid arguments', async t => {
  mockAgentService.createOrUpdate.withArgs(invalidArgs).returns(Promise.reject({ message: '', stack: '' })) // eslint-disable-line

  const handleErrorStub = sinon.stub(module.Mqtt, 'handleError')

  const topicsAllowed = module.Mqtt.getTopicsAllowed()
  const payload = { agent: invalidAgent }
  const args = JSON.stringify(invalidArgs)
  await mqtt.registerAgent({
    topic: topicsAllowed.agentPublishesMessage,
    payload: JSON.stringify(payload)
  }, { id: '111' })
  t.true(mqtt.agentService.createOrUpdate.calledWith(JSON.parse(args)))
  t.false(mqttModule.publish.called, 'Should does not post a message')
  t.true(handleErrorStub.called, `Should handle the error`)
  handleErrorStub.restore()
})

test.serial('mqtt#onClientConnected', t => {
  mqtt.onClientConnected({ id: '22' })
  t.true(debug.called, 'Should log a connected client')
  t.is(mqtt.agents.size, 1, 'Should exists a stored agent')
  mqtt.agents.clear()
})

test('Mqtt#onClientDisconnected', t => {
  module.Mqtt.onClientDisconnected({ id: '22' })
  t.true(debug.called, 'Should log a disconnected client')
})

test('Mqtt#isConnectedAgent', t => {
  const topic = module.Mqtt.getTopicsAllowed().connectedAgent
  const result = module.Mqtt.isConnectedAgent(topic)
  t.true(result, 'Should check if the topic has the value agent connected')
})

test('Mqtt#isDisconnectedAgent', t => {
  const topic = module.Mqtt.getTopicsAllowed().disconnectedAgent
  const result = module.Mqtt.isDisconnectedAgent(topic)
  t.true(result, 'Should check if the topic has the value agent disconnected')
})

test('Mqtt#isAgentPublishesMessage', t => {
  const topic = module.Mqtt.getTopicsAllowed().agentPublishesMessage
  const result = module.Mqtt.isAgentPublishesMessage(topic)
  t.true(result, 'Should check if the topic has the value agent publish a message')
})

test('Mqtt#getTopicsAllowed', t => {
  const availableMessages = module.Mqtt.getTopicsAllowed()
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
