'use strict'
const debug = require('debug')('thingsverse:static-server')
const chalk = require('chalk')
const http = require('http')
const express = require('express')
const path = require('path')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)
app.use(express.static(path.resolve(__dirname, '../public')))

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  socket.on('agent/message', payload => {
    console.log(payload)
  })

  setInterval(() => {
    socket.emit('agent/message', { agent: 'xxx-xxx-xxx' })
  }, 3000)
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
  })

  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)
}
