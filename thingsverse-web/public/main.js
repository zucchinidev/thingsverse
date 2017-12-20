'use strict'
/* global io */
const socket = io()

socket.on('agent/message', payload => {
  console.log(payload)
})

setTimeout(() => {
  socket.emit('agent/message', 'hello server!!!')
}, 5000)
