#!/usr/bin/env node
'use strict'

const blessed = require('blessed')
const contrib = require('blessed-contrib')
const ThingsverseAgent = require('thingsverse-agent')
const moment = require('moment')
const agent = new ThingsverseAgent()
const screen = blessed.screen()

const agents = new Map()
const agentMetrics = new Map()
const extended = []
const selectedNode = {
  uuid: null,
  type: null
}
/* eslint new-cap: off  */
const grid = new contrib.grid({
  rows: 1,
  cols: 4,
  screen
})

const tree = grid.set(0, 0, 1, 1, contrib.tree, {
  label: 'Connected Agents'
})

const line = grid.set(0, 1, 1, 3, contrib.line, {
  label: 'Metric',
  showLegend: true,
  minY: 0,
  xPadding: 5
})

agent.on('agent/connected', payload => {
  const { uuid } = payload.agent
  if (!agents.has(uuid)) {
    agents.set(uuid, payload.agent)
    agentMetrics.set(uuid, {})
  }

  renderData()
})

agent.on('agent/disconnected', payload => {
  const { uuid } = payload.agent
  if (agents.has(uuid)) {
    agents.delete(uuid)
    agentMetrics.delete(uuid)
  }

  renderData()
})

agent.on('agent/message', payload => {
  const LIMIT_ELEMENTS = 20
  const { uuid } = payload.agent
  if (!agents.has(uuid)) {
    agents.set(uuid, payload.agent)
    agentMetrics.set(uuid, {})
  }

  const metrics = agentMetrics.get(uuid)
  payload.metrics.forEach(m => {
    const { type, value } = m
    if (!Array.isArray(metrics[type])) {
      metrics[type] = []
    }

    if (metrics[type].length >= LIMIT_ELEMENTS) {
      metrics[type].shift()
    }

    metrics[type].push({
      value,
      timestamp: moment(payload.timestamp).format('HH:mm:ss')
    })
  })

  renderData()
})

function renderData () {
  const treeData = {}
  for (const [uuid, value] of agents) {
    const title = `${value.name} - (${value.pid})`
    treeData[title] = {
      uuid,
      agent: true,
      extended: extended.includes(uuid),
      children: {}
    }
    /*
    * metrics = { rss: [1, 2, 3], memory: [2,4,6] }
    */
    const metrics = agentMetrics.get(uuid)
    Object.keys(metrics).forEach(type => {
      const metric = {
        uuid,
        type,
        metric: true
      }
      const metricName = ` ${type} ${' '.repeat(1000)} ${uuid}`
      treeData[title].children[metricName] = metric
    })
  }
  tree.setData({
    extended: true,
    children: treeData
  })
  renderMetric()
}

function renderMetric () {
  const hasNotSelectedMetric = !selectedNode.uuid && !selectedNode.type
  if (hasNotSelectedMetric) {
    line.setData([{ x: [], y: [], title: '' }])
    screen.render()
    return
  }

  const metrics = agentMetrics.get(selectedNode.uuid)
  const values = metrics[selectedNode.type]
  const series = [{
    title: selectedNode.type,
    x: values.map(v => v.timestamp).slice(-10),
    y: values.map(v => v.value).slice(-10)
  }]
  line.setData(series)
  screen.render()
}

tree.on('select', node => {
  const { uuid, type } = node
  const isAgent = node.agent
  if (isAgent) {
    if (node.extended) {
      extended.push(uuid)
    } else {
      const index = extended.findIndex(e => e === uuid)
      if (index !== -1) {
        extended.splice(index, 1)
      }
    }
    selectedNode.type = null
    selectedNode.uuid = null
    return
  }
  selectedNode.type = type
  selectedNode.uuid = uuid
  renderMetric()
})

screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  process.exit(0)
})

agent.connect()
tree.focus()
screen.render()
