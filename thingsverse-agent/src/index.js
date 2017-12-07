'use strict'

const EventEmitter = require('events')

module.exports = class ThingsverseAgent extends EventEmitter {
  constructor (opts) {
    super()
    this._options = opts
    this._timer = null
    this._started = false
  }

  connect () {
    if (!this._started) {
      this._started = true
      this.emit('connected')
      const { interval } = this._options
      this._timer = setInterval(() => {
        this.emit('agent/message', 'this is a message')
      }, interval)
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
