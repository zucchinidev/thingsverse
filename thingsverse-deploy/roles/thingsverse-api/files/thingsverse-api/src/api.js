'use strict'

const debug = require('debug')('thingsverse:api:routes')
const express = require('express')
const { db } = require('thingsverse-db')
const asyncify = require('express-asyncify')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()

const config = require('./config')

const { AgentNotFoundError, MetricsNotFoundError, NotAuthorizedError } = require('./errors')

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

api.get('/agents', auth(config.auth), guard.check(['agents:read']), async (req, res, next) => {
  debug('A request has come to /agents')
  try {
    let agents
    const { user } = req
    if (!user || !user.username) {
      return next(new NotAuthorizedError())
    }
    if (user.admin) {
      agents = await services.Agent.findConnected()
    } else {
      agents = await services.Agent.findByUsername(user.username)
    }
    res.send(agents)
  } catch (err) {
    return next(err)
  }
})

api.get('/agents/:uuid', auth(config.auth), guard.check(['agents:read']), async (req, res, next) => {
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

api.get('/metrics/:uuid', auth(config.auth), guard.check(['metrics:read']), async (req, res, next) => {
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

api.get('/metrics/:uuid/:type', auth(config.auth), guard.check(['metrics:read']), async (req, res, next) => {
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
})

module.exports = api
