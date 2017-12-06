'use strict'

const debug = require('debug')('thingsverse:mqtt')
const chalk = require('chalk')
const { parsePayload } = require('./payload')

class Mqtt {
  constructor ({ mqttModule, agentService, metricService }) {
    this.mqttModule = mqttModule
    this.agentService = agentService
    this.metricService = metricService
    this.agents = new Map()
    this.setEvents()
  }

  setEvents () {
    this.mqttModule.on('clientConnected', this.onClientConnected.bind(this))
    this.mqttModule.on('clientDisconnected', Mqtt.onClientDisconnected)
    this.mqttModule.on('published', this.onPublishedMessage.bind(this))
    this.mqttModule.on('error', Mqtt.handleFatalError)
    process.on('uncaughtException', Mqtt.handleFatalError)
    process.on('unhandledRejection', Mqtt.handleFatalError)
  }

  onClientConnected (client) {
    debug(`Client Connected ${client.id}`)
    this.agents.set(client.id, null)
  }

  onPublishedMessage ({ topic, payload }, publisher) {
    debug(`Received: ${topic}`)
    switch (topic) {
      case Mqtt.getTopicsAllowed().connectedAgent:
      case Mqtt.getTopicsAllowed().disconnectedAgent:
        return debug(`Payload: ${payload}`)
      case Mqtt.getTopicsAllowed().agentPublishesMessage:
        return this.agentPublishesMessage(payload, publisher)
      default:
        debug(`Topic not valid: ${topic}`)
    }
  }

  async agentPublishesMessage (payload, publisher) {
    try {
      debug(`Payload: ${payload}`)
      const parsedPayload = parsePayload(payload)
      const isValidPayload = parsedPayload && parsedPayload.agent && parsedPayload.metrics
      if (isValidPayload) {
        const { agent, metrics } = parsedPayload
        await this.registerAgent({ agent, publisher })
        await this.storeMetrics({ metrics, uuid: agent.uuid })
      } else {
        debug(`${chalk.blue('[Warning]')} Payload not valid: ${parsedPayload}`)
      }
    } catch (err) {
      Mqtt.handleError(err)
    }
  }

  async registerAgent ({ agent, publisher }) {
    await this.agentService.createOrUpdate({ ...agent, connected: true })
    debug(`Agent: ${agent.uuid} saved`)
    if (!this.agents.get(publisher.id)) {
      this.agents.set(publisher.id, agent)
      this.mqttModule.publish({
        topic: Mqtt.getTopicsAllowed().connectedAgent,
        payload: JSON.stringify(agent)
      })
    }
  }

  async storeMetrics ({ metrics, uuid }) {
    for (let metric of metrics) {
      try {
        const createdMetric = await this.metricService.create(uuid, metric)
        debug(`Metric: ${createdMetric.id} saved on agent ${uuid}`)
      } catch (err) {
        Mqtt.handleError(err)
      }
    }
  }

  static onClientDisconnected (client) {
    debug(`Client Disconnected ${client.id}`)
  }

  static isConnectedAgent (topic) {
    return topic === Mqtt.getTopicsAllowed().connectedAgent
  }

  static isDisconnectedAgent (topic) {
    return topic === Mqtt.getTopicsAllowed().disconnectedAgent
  }

  static isAgentPublishesMessage (topic) {
    return topic === Mqtt.getTopicsAllowed().agentPublishesMessage
  }

  static getTopicsAllowed () {
    return {
      connectedAgent: 'agent/connected',
      disconnectedAgent: 'agent/disconnected',
      agentPublishesMessage: 'agent/message'
    }
  }

  static handleFatalError (err) {
    console.error(`${chalk.red('[fatal error]')} ${err.message}`)
    console.error(err.stack)
    process.exit(1)
  }

  static handleError (err) {
    console.error(`${chalk.red('[error]')} ${err.message}`)
    console.error(err.stack)
  }
}

function startServer ({ mqttModule, agentService, metricService }) {
  return new Mqtt({ mqttModule, agentService, metricService })
}

module.exports = {
  startServer,
  Mqtt
}
