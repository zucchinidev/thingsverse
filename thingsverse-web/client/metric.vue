<template>
    <div class="metric">
        <h3 class="metric-type">{{ type }}</h3>
        <line-chart
                :chart-data="datacollection"
                :options="{ responsive: true }"
                :width="400" :height="200"
        ></line-chart>
        <p v-if="error">{{error}}</p>
    </div>
</template>

<script>
  const request = require('request-promise-native')
  const moment = require('moment')
  const randomColor = require('random-material-color')

  const { serverHost } = require('../src/config')
  const LineChart = require('./line-chart')

  module.exports = {
    name: 'metric',
    components: {
      LineChart
    },
    props: ['uuid', 'type', 'socket'],

    data () {
      return {
        datacollection: {},
        error: null,
        color: null
      }
    },

    mounted () {
      this.initialize()
    },

    methods: {
      async initialize () {
        try {
          const { uuid, type } = this
          this.color = randomColor.getColor()
          const options = {
            method: 'GET',
            url: `${serverHost}/metrics/${uuid}/${type}`,
            json: true
          }
          const { metrics } = await request(options)
          const labels = []
          const data = []
          if (Array.isArray(metrics)) {
            metrics.forEach(m => {
              labels.push(this.formatMetricDate(m))
              data.push(m.value)
            })
          }

          this.setDataCollection(labels, data)

          this.startRealTime()
        } catch (e) {
          this.error = e.error.error
        }
      },

      startRealTime () {
        const { type, uuid, socket } = this
        const limitElements = 20
        socket.on('agent/message', payload => {
          if (payload.agent.uuid === uuid) {
            const metric = payload.metrics.find(m => m.type === type)

            // Copy current values
            const { labels, datasets: [{ data }] } = this.datacollection
            const length = labels.length || data.length
            const tooManyElements = length >= limitElements
            if (tooManyElements) {
              labels.shift()
              data.shift()
            }
            labels.push(this.formatMetricDate(metric))
            data.push(metric.value)
            this.setDataCollection(labels, data)
          }
        })
      },

      setDataCollection (labels, data) {
        this.datacollection = {
          labels,
          datasets: [{
            backgroundColor: this.color,
            label: this.type,
            data
          }]
        }
      },

      formatMetricDate (metric) {
        return moment(metric.createdAt).format('HH:mm:ss')
      },

      handleError (err) {
        this.error = err.message
      }
    }
  }
</script>
<style>
    .metric {
        border: 1px solid white;
        margin: 0 auto;
    }

    .metric-type {
        font-size: 28px;
        font-weight: normal;
        font-family: 'Roboto', sans-serif;
    }

    canvas {
        margin: 0 auto;
    }
</style>
