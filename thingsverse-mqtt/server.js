'use strict'

const debug = require('debug')('thingsverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('thingsverse-db')
const parsePayload = require('./payload')

// let Metric = null
let Agent = null

const agents = new Map()

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const mqttServerSettings = {
  port: 1883,
  backend
}
const dataBaseSettings = {
  database: process.env.DB_NAME || 'thingsverse',
  username: process.env.DB_USER || 'thingsverse',
  password: process.env.DB_PASS || 'thingsverse',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres'
}

const server = new mosca.Server(mqttServerSettings)

server.on('ready', async () => {
  const services = await db(dataBaseSettings).catch(handleFatalError)
  Agent = services.Agent
  // Metric = services.Metric
  console.log(`${chalk.green('[thingsverse-mqtt]')} server is running`)
})

server.on('clientConnected', (client) => {
  debug(`Client Connected ${client.id}`)
  agents.set(client.id, null)
})

server.on('clientDisconnected', (client) => {
  debug(`Client Disconnected ${client.id}`)
})

server.on('published', async ({ topic, payload }, publisher) => {
  debug(`Received: ${topic}`)
  switch (topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Payload: ${payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${payload}`)
      const { agent } = parsePayload(payload)
      agent.connected = true
      let newAgent
      try {
        newAgent = await Agent.createOrUpdate(agent)
      } catch (err) {
        return handleError(err)
      }
      debug(`Agent: ${newAgent.uuid} saved`)
      if (!agents.get(publisher.id)) {
        agents.set(publisher.id, newAgent)
        server.publish({
          topic: 'agent/connected',
          payload: JSON.stringify({
            uuid: newAgent.uuid,
            name: newAgent.name,
            hostname: newAgent.hostname,
            pid: newAgent.pid,
            connected: newAgent.connected
          })
        })
      }
      break

    default:
      debug(`Topic not valid: ${topic}`)
  }
})

server.on('error', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

function handleError (err) {
  console.error(`${chalk.red('[error]')} ${err.message}`)
  console.error(err.stack)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
