'use strict'

const debug = require('debug')('thingsverse:mqtt')
const chalk = require('chalk')
const { parsePayload } = require('thingsverse-payload-parser')

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
    this.mqttModule.on('clientDisconnected', this.onClientDisconnected.bind(this))
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
      case Mqtt.topics().connectedAgent:
      case Mqtt.topics().disconnectedAgent:
        return debug(`Payload: ${payload}`)
      case Mqtt.topics().agentPublishesMessage:
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
      const topic = Mqtt.topics().connectedAgent
      const payload = JSON.stringify(agent)
      this.mqttModule.publish({
        topic,
        payload
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

  async onClientDisconnected (client) {
    debug(`Client Disconnected ${client.id}`)
    const agent = this.agents.get(client.id)
    if (agent) {
      agent.connected = false
      try {
        await this.agentService.createOrUpdate(agent)
        this.agents.delete(client.id)
        const topic = Mqtt.topics().disconnectedAgent
        const payload = JSON.stringify({ agent: { uuid: agent.uuid } })
        this.mqttModule.publish({
          topic,
          payload
        })
        debug(`Client with id: ${client.id} associated to Agent (${agent.uuid}) marked as disconnected`)
      } catch (err) {
        return Mqtt.handleError(err)
      }
    }
  }

  static isConnectedAgent (topic) {
    return topic === Mqtt.topics().connectedAgent
  }

  static isDisconnectedAgent (topic) {
    return topic === Mqtt.topics().disconnectedAgent
  }

  static isAgentPublishesMessage (topic) {
    return topic === Mqtt.topics().agentPublishesMessage
  }

  static topics () {
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
