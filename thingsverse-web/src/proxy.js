'use strict'

const express = require('express')
const request = require('request-promise-native')
const asyncify = require('express-asyncify')

const api = asyncify(express.Router())

const { apiToken, endpoint } = require('./config')

api.get('/agents', generateRequest)

api.get('/agents/:uuid', generateRequest)

api.get('/metrics/:uuid', generateRequest)

api.get('/metrics/:uuid/:type', generateRequest)

async function generateRequest (req, res, next) {
  try {
    const options = generateRequestOptions(req)
    const result = await request(options)
    res.send(result)
  } catch (err) {
    return next(err)
  }
}

function generateRequestOptions ({ method, originalUrl }) {
  return {
    method,
    url: `${endpoint}/api${originalUrl}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
}

module.exports = api
