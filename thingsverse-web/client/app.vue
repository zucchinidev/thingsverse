<template>
    <div>
        <agent
                v-for="agent in agents"
                :uuid="agent.uuid"
                :key="agent.uuid"
                :socket="socket">
        </agent>
        <p v-if="error">{{error}}</p>
    </div>
</template>


<script>
  const request = require('request-promise-native')
  const io = require('socket.io-client')
  const { serverHost } = require('../src/config')
  const socket = io()

  module.exports = {
    data () {
      return {
        agents: [],
        error: null,
        socket
      }
    },

    mounted () {
      this.initialize()
    },

    methods: {
      async initialize () {
        const options = {
          method: 'GET',
          url: `${serverHost}/agents`,
          json: true
        }

        try {
          this.agents = await request(options)
        } catch (e) {
          this.error = e.error.error
          return
        }

        socket.on('agent/connected', payload => {
          const { uuid } = payload.agent
          const existing = this.agents.find(a => a.uuid === uuid)
          if (!existing) {
            this.agents.push(payload.agent)
          }
        })
      }
    }
  }
</script>

<style>
    body {
        font-family: Arial;
        background: #f8f8f8;
        margin: 0;
    }
</style>
