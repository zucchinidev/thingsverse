'use strict'

const EventEmitter = require('events')
const debug = require('debug')('thingsverse:agent')
const defaults = require('defaults')
const mqtt = require('mqtt')
const util = require('util')
const os = require('os')
const { parsePayload } = require('thingsverse-payload-parser')
const { v4 } = require('uuid')

const defaultOptions = {
  name: 'untitled',
  username: 'things',
  interval: 5000,
  mqtt: {
    host: 'mqtt://localhost'
  }
}

/**
 * Bidirectional client, send and receive message
 * @type {module.ThingsverseAgent}
 */
module.exports = class ThingsverseAgent extends EventEmitter {
  constructor (opts) {
    super()
    this.options = defaults(opts, defaultOptions)
    this._timer = null
    this._started = false
    this._client = null
    this._metrics = new Map()
  }

  addMetric (type, fn) {
    this._metrics.set(type, fn)
  }

  removeMetric (type) {
    this._metrics.delete(type)
  }

  connect () {
    if (!this._started) {
      const { mqtt: { host } } = this.options
      this._client = mqtt.connect(host)
      this._client.subscribe('agent/message')
      this._client.subscribe('agent/connected')
      this._client.subscribe('agent/disconnected')
      this._client.on('connect', this.clientConnect.bind(this))
      this._client.on('message', this.messageReceived.bind(this))
      this._client.on('error', () => this.disconnect())
      this._started = true
    }
  }

  clientConnect () {
    const { interval } = this.options
    this.agentId = v4()
    this.emit('connected', this.agentId)
    this._timer = setInterval(this.emitMessage.bind(this), interval)
  }

  async emitMessage () {
    if (this._metrics.size > 0) {
      const message = this.getNewMessage()

      for (let [type, fn] of this._metrics) {
        if (fn.length === 1) {
          fn = util.promisify(fn)
        }

        message.metrics.push({
          type,
          value: await Promise.resolve(fn())
        })
      }
      debug(`Sending ${message}`)
      this._client.publish('agent/message', JSON.stringify(message))
      this.emit('message', message)
    }
  }

  getNewMessage () {
    const { username, name } = this.options
    return {
      agent: {
        uuid: this.agentId,
        username,
        name,
        hostname: os.hostname() || 'localhost',
        pid: process.pid
      },
      metrics: [],
      timestamp: new Date().getTime()
    }
  }

  messageReceived (topic, payload) {
    payload = parsePayload(payload)
    let toDoBroadcast = false
    switch (topic) {
      case 'agent/connected':
      case 'agent/disconnected':
      case 'agent/message':
        toDoBroadcast = payload && payload.agent && payload.agent.uuid !== this.agentId
        break
    }

    if (toDoBroadcast) {
      this.emit(topic, payload)
    }
  }

  disconnect () {
    if (this._started) {
      clearInterval(this._timer)
      this._started = false
      this.emit('disconnected', this.agentId)
      this._client.end()
    }
  }
}
