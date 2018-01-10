'use strict'

const { Line, mixins } = require('vue-chartjs')
const { reactiveProp } = mixins

module.exports = {
  extends: Line,
  mixins: [ reactiveProp ],
  props: [ 'options' ],
  mounted () {
    // Overwriting base render method with actual data.
    this.renderChart(this.chartData, this.options)
  }
}
