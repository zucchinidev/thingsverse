'use strict'

const debug = require('debug')('thingsverse:mqtt')
const chalk = require('chalk')
const { parsePayload } = require('./payload')

class Mqtt {
  constructor ({ mqttModule, agentService }) {
    this.mqttModule = mqttModule
    this.agentService = agentService
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

  async onPublishedMessage ({ topic, payload }, publisher) {
    debug(`Received: ${topic}`)
    if (Mqtt.isConnectedAgent(topic) || Mqtt.isDisconnectedAgent(topic)) {
      return debug(`Payload: ${payload}`)
    }

    if (Mqtt.isAgentPublishesMessage(topic)) {
      try {
        debug(`Payload: ${payload}`)
        const { agent } = parsePayload(payload)
        await this.registerAgent({ agent, publisher })
      } catch (err) {
        Mqtt.handleError(err)
      }
    } else {
      debug(`Topic not valid: ${topic}`)
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

function startServer ({ mqttModule, agentService }) {
  return new Mqtt({ mqttModule, agentService })
}

module.exports = {
  startServer,
  Mqtt
}
