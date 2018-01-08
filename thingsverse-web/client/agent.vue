<template>
    <div class="agent">
        <div>
            <h2 class="agent-title">{{name}} ({{pid}})</h2>
            <p class="agent-host">{{hostname}}</p>
            <p class="agent-status">Connected: <span>{{connected}}</span></p>
            <button v-on:click="toggleMetrics" class="button">Toggle Metrics</button>
            <div v-show="showMetrics">
                <h3 class="metrics-title">Metrics</h3>
                <metric
                        :uuid="uuid"
                        :socket="socket"
                        v-for="metric in metrics"
                        :type="metric.type"
                        :key="metric.type">
                </metric>
            </div>
        </div>
        <p v-if="error">{{error}}</p>
    </div>
</template>

<script>
  const request = require('request-promise-native')
  const { serverHost } = require('../src/config')

  module.exports = {
    props: ['uuid', 'socket'],

    data () {
      return {
        name: null,
        hostname: null,
        connected: false,
        pid: null,
        showMetrics: false,
        error: null,
        metrics: []
      }
    },

    mounted () {
      this.initialize()
    },

    methods: {
      async initialize () {
        try {
          const options = {
            method: 'GET',
            url: `${serverHost}/agent/${this.uuid}`,
            json: true
          }
          const agent = await request(options)
          this.name = agent.name
          this.hostname = agent.hostname
          this.connected = agent.connected
          this.pid = agent.pid
          this.loadMetrics()
        } catch (e) {
          this.error = e.error.error
        }
      },

      async loadMetrics () {
        try {
          const options = {
            method: 'GET',
            url: `${serverHost}/metrics/${this.uuid}`,
            json: true
          }
          this.metrics = await request(options)
          this.startRealTime()
        } catch (e) {
          this.error = e.error.error
        }
      },

      startRealTime () {
        this.socket.on('agent/disconnected', payload => {
          if (payload.agent.uuid === this.uuid) {
            this.connected = false
          }
        })
      },

      toggleMetrics () {
        this.showMetrics = !this.showMetrics
      }
    }
  }
</script>


<style>
    .metrics-title {
        text-align: center;
        font-size: 28px;
        letter-spacing: 1px;
        font-family: 'Monserrat', sans-serif;
    }

    .button {
        text-transform: uppercase;
        color: #ff7a22;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        outline: 0;
        padding: 0;
        font-family: 'Roboto', sans-serif;
    }

    .agent {
        max-width: 850px;
        box-sizing: border-box;
        border-radius: 4px;
        background: white;
        padding: 20px;
        font-family: 'Roboto', sans-serif;
        margin: 24px 15px;
        box-shadow: 0 1px 3px 0 rgba(165, 165, 165, 0.2), 0 2px 2px 0 rgba(163, 137, 137, 0.12), 0 0 2px 0 rgba(0, 0, 0, 0.14);
    }

    .agent-title {
        font-size: 32px;
        letter-spacing: 1px;
        margin: 0;
        font-family: 'Monserrat', sans-serif;
    }

    .agent-host {
        font-size: 20px;
    }

    .agent-status {
        font-size: 20px
    }

    .agent-status span {
        font-weight: bold;
        color: #ff7a22;
    }

    @media screen and (min-width: 850px) {
        .agent {
            padding: 20px 85px;
            margin: 24px auto;
        }
    }
</style>
