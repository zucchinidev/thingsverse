'use strict'

function pipe (source, target) {
  if (!source.emit || !target.emit) {
    throw new TypeError(`Please pass EventEmmitter's as arguments`)
  }
  const emit = source._emit = source.emit
  source.emit = function () {
    emit.apply(source, arguments)
    target.emit.apply(target, arguments)
  }
}

module.exports = {
  pipe
}
