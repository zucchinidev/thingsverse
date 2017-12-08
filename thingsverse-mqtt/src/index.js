'use strict'

const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const { startServer } = require('./mqtt')
const db = require('thingsverse-db')

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

async function init () {
  const mqttModule = new mosca.Server(mqttServerSettings)
  mqttModule.on('ready', () => {
    console.log(`${chalk.green('[thingsverse-mqtt]')} server is running`)
  })

  const { Agent: agentService, Metric: metricService } = await db(dataBaseSettings)
  startServer({
    mqttModule,
    agentService,
    metricService
  })
}

init()
