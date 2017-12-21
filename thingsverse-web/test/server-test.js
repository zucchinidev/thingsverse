'use strict'

const test = require('ava')
const sinon = require('sinon')

const proxyquire = require('proxyquire')
const request = require('supertest')
const { endpoint, apiToken } = require('../src/config')

let sandbox = null
let server = null
let requestStub = null
let ioStub = null

function ThingsverseAgentStub () {}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  requestStub = sandbox.stub().returns(Promise.resolve())
  ioStub = {
    on: sandbox.stub()
  }
  const proxy = proxyquire('../src/proxy', {
    'request-promise-native': requestStub
  })

  server = proxyquire('../', {
    './proxy': proxy,
    './thingsverse-agent': ThingsverseAgentStub,
    'socket.io': () => ioStub
  })
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

for (const testCase of getTestCases()) {
  test.serial.cb(testCase.text, t => {
    request(server)
      .get(testCase.path)
      .end((err, _) => {
        t.falsy(err, 'should return an error')
        t.true(requestStub.called, 'should execute a http request')
        t.true(requestStub.calledWith(getArgs(testCase)), 'should execute a http request')
        t.end()
      })
  })
}

function getArgs ({ path }) {
  return {
    method: 'GET',
    url: `${endpoint}/api${path}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
}

function getTestCases () {
  return [
    {
      text: '/agents',
      path: '/agents',
      statusCode: 200,
      contentType: /json/
    },
    {
      text: '/agents/:uuid',
      path: '/agents/yyy-yyy-yyy',
      statusCode: 200,
      contentType: /json/
    },
    {
      text: '/metrics/:uuid',
      path: '/metrics/yyy-yyy-yyy',
      statusCode: 200,
      contentType: /json/
    },
    {
      text: '/metrics/:uuid/:type',
      path: '/metrics/yyy-yyy-yyy/a',
      statusCode: 200,
      contentType: /json/
    }
  ]
}
