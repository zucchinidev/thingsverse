'use strict'

const test = require('ava')
const sinon = require('sinon')
const { promisify } = require('util')

const proxyquire = require('proxyquire')
const request = require('supertest')
const { agentFixture, metricFixture } = require('./fixtures')
const auth = require('../src/auth')
const config = require('../src/config')

const sign = promisify(auth.sign)
let token = null
let sandbox = null
let server = null
let dbStub = null
const thingsverseDbStub = {}
let AgentServiceStub = {}
let MetricServiceStub = {}
const wrongUuid = 'wrongUuid'
const wrongType = 'wrongType'

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentServiceStub,
    Metric: MetricServiceStub
  }))
  thingsverseDbStub.db = dbStub
  AgentServiceStub.findConnected = sandbox.stub()
  AgentServiceStub.findConnected.returns(Promise.resolve(agentFixture.connected))
  AgentServiceStub.findByUuid = sandbox.stub()
  AgentServiceStub.findByUuid.returns(Promise.resolve(agentFixture.single))
  AgentServiceStub.findByUuid.withArgs(wrongUuid).returns(Promise.resolve(null))
  MetricServiceStub.findByTypeAgentUuid = sandbox.stub()
  MetricServiceStub.findByTypeAgentUuid.returns(Promise.resolve(metricFixture.getByTypeAgentId('a', 1)))
  MetricServiceStub.findByTypeAgentUuid.withArgs(wrongType, wrongUuid).returns(Promise.resolve(null))
  MetricServiceStub.findByAgentUuid = sandbox.stub()
  MetricServiceStub.findByAgentUuid.returns(Promise.resolve(metricFixture.getByUuid(1)))
  MetricServiceStub.findByAgentUuid.withArgs(wrongUuid).returns(Promise.resolve(null))

  const api = proxyquire('../src/api', {
    'thingsverse-db': thingsverseDbStub
  })

  token = await sign({ admin: true, username: 'test' }, config.auth.secret)
  server = proxyquire('../', {
    './api': api
  })
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

const testCases = [
  {
    text: '/api/agents',
    path: '/api/agents',
    statusCode: 200,
    contentType: /json/,
    expectedBody: JSON.stringify(agentFixture.connected)
  },
  {
    text: '/api/agents/:uuid',
    path: '/api/agents/yyy-yyy-yyy',
    statusCode: 200,
    contentType: /json/,
    expectedBody: JSON.stringify(agentFixture.single)
  },
  {
    text: '/api/metrics/:uuid',
    path: '/api/metrics/yyy-yyy-yyy',
    statusCode: 200,
    contentType: /json/,
    expectedBody: JSON.stringify({ metrics: metricFixture.getByUuid(1) })
  },
  {
    text: '/api/metrics/:uuid/:type',
    path: '/api/metrics/yyy-yyy-yyy/a',
    statusCode: 200,
    contentType: /json/,
    expectedBody: JSON.stringify({ metrics: metricFixture.getByTypeAgentId('a', 1) })
  },
  {
    text: '/api/agents/:uuid - not found',
    path: `/api/agents/${wrongUuid}`,
    statusCode: 404,
    contentType: /json/,
    expectedBody: JSON.stringify({ error: `Agent with uuid ${wrongUuid} not found` })
  },
  {
    text: '/api/metrics/:uuid - not found',
    path: `/api/metrics/${wrongUuid}`,
    statusCode: 404,
    contentType: /json/,
    expectedBody: JSON.stringify({ error: `Metrics of Agent with uuid ${wrongUuid} not found` })
  },
  {
    text: '/api/metrics/:uuid/:type - not found',
    path: `/api/metrics/${wrongUuid}/${wrongType}`,
    statusCode: 404,
    contentType: /json/,
    expectedBody: JSON.stringify({ error: `Metrics of Agent with uuid ${wrongUuid} and type ${wrongType} not found` })
  }
]

for (const testCase of testCases) {
  test.serial.cb(testCase.text, t => {
    request(server)
      .get(testCase.path)
      .set('Authorization', `Bearer ${token}`)
      .expect(testCase.statusCode)
      .expect('Content-Type', testCase.contentType)
      .end((err, res) => {
        t.falsy(err, 'should return an error')
        const body = JSON.stringify(res.body)
        t.deepEqual(body, testCase.expectedBody, 'response body should be the expected')
        t.end()
      })
  })
}
