'use strict'

const debug = require('debug')('thingsverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const moscaSettings = {
  port: 1883,
  backend
}

const server = new mosca.Server(moscaSettings)

server.on('ready', () => {
  console.log(`${chalk.green('[thingsverse-mqtt]')} server is running`)
})
