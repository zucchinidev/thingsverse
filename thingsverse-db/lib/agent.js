module.exports = function setupAgent (AgentModel) {
  function findById (id) {
    return AgentModel.findById(id)
  }

  async function createOrUpdate (agent) {
    const condition = {
      where: {
        uuid: agent.uuid
      }
    }

    const existingAgent = await AgentModel.findOne(condition)
    if (existingAgent) {
      const updated = await AgentModel.update(agent, condition)
      return updated ? AgentModel.findOne(condition) : existingAgent
    }

    const result = await AgentModel.create(agent)
    return result.toJSON()
  }

  return {
    findById,
    createOrUpdate
  }
}