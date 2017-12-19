'use strict'

const http = require('http')
const express = require('express')
const chalk = require('chalk')
const debug = require('debug')('thingsverse:server')
const asyncify = require('express-asyncify')
const api = require('./api')

const port = process.env.PORT || 3000
const app = asyncify(express())

app.use('/api', api)

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

const server = http.createServer(app)

if (!module.parent) {
  server.listen(port, () => {
    console.log(`${chalk.green('[thingsverse-api]')} server listening on port ${port}`)
  })
  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)
}

module.exports = server
