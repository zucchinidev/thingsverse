'use strict'

module.exports = class AgentNotFoundError extends Error {
  constructor (uuid, ...params) {
    super(...params)
    this.uuid = uuid
    this.status = 404
    Error.captureStackTrace(this, this.constructor)
    this.message = `Agent with uuid ${uuid} not found`
  }
}
