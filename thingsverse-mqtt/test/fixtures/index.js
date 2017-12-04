const agent = {
  id: 1,
  uuid: 'yyy-yyy-yyy',
  name: 'fixture',
  username: 'things',
  hostname: 'text-host',
  pid: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}

const invalidAgent = {
  uuid: null
}

module.exports = {
  agent,
  invalidAgent
}
