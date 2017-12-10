'use strict'

const debug = require('debug')('thingsverse:api:routes')
const express = require('express')
const AgentNotFoundError = require('./errors/agent-not-found-error')

const api = express.Router()

api.get('/agents', (req, res) => {
  debug('A request has come to /agents')
  res.send({})
})

api.get('/agents/:uuid', (req, res, next) => {
  const { uuid } = req.params
  if (uuid !== 'yyy') {
    return next(new AgentNotFoundError(uuid))
  }
  res.send({ uuid })
})

api.get('/metrics/:uuid', (req, res) => {
  const { uuid } = req.params
  res.send({ uuid })
})

api.get('/metrics/:uuid/:type', (req, res) => {
  const { uuid, type } = req.params
  res.send({ uuid, type })
})

module.exports = api
