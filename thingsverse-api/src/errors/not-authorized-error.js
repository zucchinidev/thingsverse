'use strict'

module.exports = class NotAuthorizedError extends Error {
  constructor (...params) {
    super(...params)
    this.statusCode = 401
    Error.captureStackTrace(this, this.constructor)
    this.message = `This user is not authorized to access the requested content`
  }
}
