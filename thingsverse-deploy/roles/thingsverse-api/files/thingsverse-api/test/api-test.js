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

  server = proxyquire('../', {
    './api': api
  })
})

test.afterEach(() => {
  sandbox && sandbox.restore()
});

(async function () {
  for (const testCase of await getTestCases()) {
    test.serial.cb(testCase.text, t => {
      request(server)
        .get(testCase.path)
        .set('Authorization', `Bearer ${testCase.token}`)
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
})()

async function getTestCases () {
  const tokenWithAgentsReadPermissions = await sign({
    admin: true,
    username: 'test',
    permissions: ['agents:read']
  }, config.auth.secret)
  const tokenWithMetricsPermissions = await sign({
    admin: true,
    username: 'test',
    permissions: ['metrics:read']
  }, config.auth.secret)
  const tokenWithoutPermissions = await sign({ admin: true, username: 'test', permissions: [] }, config.auth.secret)
  const tokenWithoutUsername = await sign({ admin: true }, config.auth.secret)

  const notAuthorizedBodyError = { error: 'No authorization token was found' }
  const forbiddenBodyError = { error: 'Permission denied' }
  return [
    {
      text: '/api/agents',
      path: '/api/agents',
      statusCode: 200,
      contentType: /json/,
      token: tokenWithAgentsReadPermissions,
      expectedBody: JSON.stringify(agentFixture.connected)
    },
    {
      text: '/api/agents/:uuid',
      path: '/api/agents/yyy-yyy-yyy',
      statusCode: 200,
      contentType: /json/,
      token: tokenWithAgentsReadPermissions,
      expectedBody: JSON.stringify(agentFixture.single)
    },
    {
      text: '/api/metrics/:uuid',
      path: '/api/metrics/yyy-yyy-yyy',
      statusCode: 200,
      contentType: /json/,
      token: tokenWithMetricsPermissions,
      expectedBody: JSON.stringify({ metrics: metricFixture.getByUuid(1) })
    },
    {
      text: '/api/metrics/:uuid/:type',
      path: '/api/metrics/yyy-yyy-yyy/a',
      statusCode: 200,
      contentType: /json/,
      token: tokenWithMetricsPermissions,
      expectedBody: JSON.stringify({ metrics: metricFixture.getByTypeAgentId('a', 1) })
    },
    {
      text: '/api/agents/:uuid - not found',
      path: `/api/agents/${wrongUuid}`,
      statusCode: 404,
      contentType: /json/,
      token: tokenWithAgentsReadPermissions,
      expectedBody: JSON.stringify({ error: `Agent with uuid ${wrongUuid} not found` })
    },
    {
      text: '/api/metrics/:uuid - not found',
      path: `/api/metrics/${wrongUuid}`,
      statusCode: 404,
      contentType: /json/,
      token: tokenWithMetricsPermissions,
      expectedBody: JSON.stringify({ error: `Metrics of Agent with uuid ${wrongUuid} not found` })
    },
    {
      text: '/api/metrics/:uuid/:type - not found',
      path: `/api/metrics/${wrongUuid}/${wrongType}`,
      statusCode: 404,
      contentType: /json/,
      token: tokenWithMetricsPermissions,
      expectedBody: JSON.stringify({ error: `Metrics of Agent with uuid ${wrongUuid} and type ${wrongType} not found` })
    },
    {
      text: '/api/agents - not authorized',
      path: '/api/agents',
      statusCode: 401,
      contentType: /json/,
      token: '',
      expectedBody: JSON.stringify(notAuthorizedBodyError)
    },
    {
      text: '/api/agents - not authorized without username',
      path: '/api/agents',
      statusCode: 403,
      contentType: /json/,
      token: tokenWithoutUsername,
      expectedBody: JSON.stringify({ error: 'Could not find permissions for user. Bad configuration?' })
    },
    {
      text: '/api/agents/:uuid - not authorized',
      path: '/api/agents/yyy-yyy-yyy',
      statusCode: 401,
      contentType: /json/,
      token: '',
      expectedBody: JSON.stringify(notAuthorizedBodyError)
    },
    {
      text: '/api/metrics/:uuid - not authorized',
      path: '/api/metrics/yyy-yyy-yyy',
      statusCode: 401,
      contentType: /json/,
      token: '',
      expectedBody: JSON.stringify(notAuthorizedBodyError)
    },
    {
      text: '/api/metrics/:uuid/:type - not authorized',
      path: '/api/metrics/yyy-yyy-yyy/a',
      statusCode: 401,
      contentType: /json/,
      token: '',
      expectedBody: JSON.stringify(notAuthorizedBodyError)
    },
    {
      text: '/api/agents - Forbidden',
      path: '/api/agents',
      statusCode: 403,
      contentType: /json/,
      token: tokenWithoutPermissions,
      expectedBody: JSON.stringify(forbiddenBodyError)
    },
    {
      text: '/api/agents/:uuid - Forbidden',
      path: '/api/agents/yyy-yyy-yyy',
      statusCode: 403,
      contentType: /json/,
      token: tokenWithoutPermissions,
      expectedBody: JSON.stringify(forbiddenBodyError)
    },
    {
      text: '/api/metrics/:uuid - Forbidden',
      path: '/api/metrics/yyy-yyy-yyy',
      statusCode: 403,
      contentType: /json/,
      token: tokenWithoutPermissions,
      expectedBody: JSON.stringify(forbiddenBodyError)
    },
    {
      text: '/api/metrics/:uuid/:type - Forbidden',
      path: '/api/metrics/yyy-yyy-yyy/a',
      statusCode: 403,
      contentType: /json/,
      token: tokenWithoutPermissions,
      expectedBody: JSON.stringify(forbiddenBodyError)
    }
  ]
}
