'use strict'
const debug = require('debug')('thingsverse:static-server')
const chalk = require('chalk')
const http = require('http')
const express = require('express')
const path = require('path')
const socketIo = require('socket.io')
const asyncify = require('express-asyncify')
const ThingsverseAgent = require('thingsverse-agent')
const { pipe } = require('./util')
const proxy = require('./proxy')

const app = asyncify(express())
const server = http.createServer(app)
const io = socketIo(server)
const agent = new ThingsverseAgent()

app.use(express.static(path.resolve(__dirname, '../public')))
app.use('/', proxy)

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  pipe(agent, socket)
})

app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)
  const code = err.status || 500
  res.status(code).send({ error: err.message })
})

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

if (!module.parent) {
  const port = process.env.PORT || 8080
  server.listen(port, () => {
    debug(`${chalk.green('[thingsverse-web]')} server listening on port ${port}`)
    agent.connect()
  })

  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)
}

module.exports = server
