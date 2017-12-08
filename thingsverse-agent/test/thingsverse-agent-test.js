'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

let thingsverseAgent
let debug = null
let sandbox = null
let mqttStub = {}
let uuidStub = {}
let clientStub = null

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  debug = sandbox.spy()
  clientStub = {
    subscribe: sandbox.spy(),
    on: sandbox.stub()
  }
  mqttStub.connect = sandbox.stub().returns(clientStub)
  uuidStub.v4 = sandbox.stub().returns('xxx')
  const ThingsverseAgent = proxyquire('../', {
    'debug': () => debug,
    'mqtt': mqttStub,
    'uuid': uuidStub
  })

  thingsverseAgent = new ThingsverseAgent({
    mqtt: {
      host: 'mqtt://fake-host'
    }
  })
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('thingsverserAgent@connect', t => {
  t.truthy(thingsverseAgent, 'should exist an instance')
  thingsverseAgent.connect()
  t.true(mqttStub.connect.calledWith('mqtt://fake-host'), 'should connect with mqtt server')
  t.true(clientStub.subscribe.calledWith('agent/message'), 'The client should subscribe to agent/message')
  t.true(clientStub.subscribe.calledWith('agent/connected'), 'The client should subscribe to agent/connected')
  t.true(clientStub.subscribe.calledWith('agent/disconnected'), 'The client should subscribe to agent/disconnected')
  t.true(clientStub.on.calledWith('connect'), 'The client must react to the connect event')
  t.true(clientStub.on.calledWith('message'), 'The client must react to the message event')
  t.true(clientStub.on.calledWith('error'), 'The client must react to the error event')
})

test.serial('thingsverserAgent@clientConnect', t => {
  const timer = sinon.useFakeTimers()
  const emitMessageStub = sinon.stub(thingsverseAgent, 'emitMessage')
  const onConnectedSpy = sinon.spy()

  thingsverseAgent.on('connected', onConnectedSpy)
  thingsverseAgent.clientConnect()
  t.true(uuidStub.v4.called, 'should generate an uuid')
  t.is(thingsverseAgent.agentId, 'xxx', 'should generate an uuid representing an agent')
  timer.tick(thingsverseAgent.options.interval)
  t.true(emitMessageStub.called, 'should start a timer to send messages')
  t.true(onConnectedSpy.called, 'should emit a connected agent event')
  t.true(onConnectedSpy.calledWith('xxx'), 'should emit a connected agent event with payload: xxx')

  emitMessageStub.restore()
  timer.restore()
  thingsverseAgent.removeListener('connected', onConnectedSpy)
})

test('thingsverserAgent@disconnect', t => {
  const onDisconnectedSpy = sinon.spy()
  thingsverseAgent.on('disconnected', onDisconnectedSpy)
  thingsverseAgent.disconnect()
  t.true(onDisconnectedSpy.called, 'should emit a disconnected agent event')
  thingsverseAgent.removeListener('disconnected', onDisconnectedSpy)
})

test('thingsverserAgent@messageReceived', t => {
  const topic = 'agent/message'
  const payload = { agent: { uuid: 'xxx' } }
  const onSendTopicSpy = sinon.spy()
  thingsverseAgent.on(topic, onSendTopicSpy)
  thingsverseAgent.messageReceived(topic, JSON.stringify(payload))
  t.true(onSendTopicSpy.called, `should emit a ${topic} event`)
  t.true(onSendTopicSpy.calledWith(payload), `should emit a ${topic} event`)
  thingsverseAgent.removeListener(topic, onSendTopicSpy)
})
