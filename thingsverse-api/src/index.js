'use strict'

const http = require('http')
const express = require('express')
const chalk = require('chalk')
const debug = require('debug')
const api = require('./api')

const port = process.env.PORT || 3000
const app = express()
app.use('/api', api)
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`)
  console.log(err.stack)
  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message })
  }
  res.status(500).send({ error: err.message })
})

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

const server = http.createServer(app)
server.listen(port, () => {
  console.log(`${chalk.green('[thingsverse-api]')} server listening on port ${port}`)
})
