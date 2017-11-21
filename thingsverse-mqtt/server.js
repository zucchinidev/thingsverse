'use strict'

const debug = require('debug')('thingsverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('thingsverse-db')

let Metric = null
let Agent = null

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
  Metric = services.Metric
  console.log(`${chalk.green('[thingsverse-mqtt]')} server is running`)
})

server.on('clientConnected', (client) => {
  debug(`Client Connected ${client.id}`)
})

server.on('clientDisconnected', (client) => {
  debug(`Client Disconnected ${client.id}`)
})

server.on('published', (packet, client) => {
  debug(`Received: ${packet.topic}`)
  debug(`Payload: ${packet.payload}`)
})

server.on('error', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
