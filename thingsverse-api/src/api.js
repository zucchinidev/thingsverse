'use strict'

const debug = require('debug')('thingsverse:api:routes')
const express = require('express')
const db = require('thingsverse-db')
const asyncify = require('express-asyncify')

const config = require('./config')

const AgentNotFoundError = require('./errors/agent-not-found-error')
const MetricsNotFoundError = require('./errors/metrics-not-found-error')

const api = asyncify(express.Router())
let services

api.use('*', async (req, res, next) => {
  if (!services) {
    debug('Connecting to database')
    try {
      services = await db(config.db)
    } catch (err) {
      return next(err)
    }
  }
  next()
})

api.get('/agents', async (req, res, next) => {
  debug('A request has come to /agents')
  try {
    const agents = await services.Agent.findConnected()
    res.send(agents)
  } catch (err) {
    return next(err)
  }
})

api.get('/agents/:uuid', async (req, res, next) => {
  try {
    const { uuid } = req.params
    debug(`request to /agents/${uuid}`)
    const agent = await services.Agent.findByUuid(uuid)
    if (!agent) {
      return next(new AgentNotFoundError(uuid))
    }
    res.send(agent)
  } catch (err) {
    return next(err)
  }
})

api.get('/metrics/:uuid', async (req, res, next) => {
  try {
    const { uuid } = req.params
    debug(`request to /metrics/${uuid}`)
    const metrics = await services.Metric.findByAgentUuid(uuid)
    if (!metrics || metrics.length === 0) {
      return next(new MetricsNotFoundError(uuid))
    }
    res.send({ metrics })
  } catch (err) {
    return next(err)
  }
})

api.get('/metrics/:uuid/:type', async (req, res, next) => {
  try {
    const { uuid, type } = req.params
    debug(`request to /metrics/${uuid}/${type}`)
    const metrics = await services.Metric.findByTypeAgentUuid(type, uuid)
    if (!metrics || metrics.length === 0) {
      return next(new MetricsNotFoundError(uuid, type))
    }
    res.send({ metrics })
  } catch (err) {
    return next(err)
  }

  const { uuid, type } = req.params
  res.send({ uuid, type })
})

module.exports = api
