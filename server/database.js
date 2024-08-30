import { JSONFilePreset } from 'lowdb/node'

// Read or create db.json
const defaultData = { users: [] }
const db = await JSONFilePreset('db.json', defaultData)

const findUser = async (username) => {
  const { users } = db.data;
  return users.find(user => user.username === username)
}

const createUser = async (username, password) => {
  if (await findUser(username)) {
    throw new Error('User already exists')
  }
  db.data.users.push({ username, password })
  await db.write()
}

const verifyUser = async (username, password) => {
  const user = await findUser(username)
  if (!user || user.password !== password) {
    return false
  }
  return true
}

export { createUser, findUser, verifyUser }
