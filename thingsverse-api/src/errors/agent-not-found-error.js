'use strict'

module.exports = class AgentNotFoundError extends Error {
  constructor (uuid, ...params) {
    super(...params)
    this.uuid = uuid
    this.code = 404
    Error.captureStackTrace(this, AgentNotFoundError)
    this.message = `Agent with uuid ${uuid} not found`
  }
}
