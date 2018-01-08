'use strict'

function pipe (agent, socket) {
  if (!agent.emit || !socket.emit) {
    throw new TypeError(`Please pass EventEmmitter's as arguments`)
  }
  const emit = agent._emit = agent.emit
  agent.emit = function () {
    emit.apply(agent, arguments)
    socket.emit.apply(socket, arguments)
    return agent
  }
}

module.exports = {
  pipe
}
