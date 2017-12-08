'use strict'

const EventEmitter = require('events')
const debug = require('debug')('thingsverse:agent')
const defaults = require('defaults')
const mqtt = require('mqtt')
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

  emitMessage () {
    this.emit('agent/message', 'this is a message')
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
      this.emit('disconnected')
    }
  }
}
