import { problems, users } from './init'
import fs from 'fs'
import { Data } from './types'

const DATA_PATH = 'competition/data.json'
export const problemsData = problems.map(it => it.config)
export const userIdMap: Record<string, [string] | string> = { }
const data: Data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

for (const id in users) userIdMap[id] = users[id].star ? [users[id].name] : users[id].name

let updated = false
export const update = () => { updated = true }

setInterval(() => {
  if (!updated) return
  updated = false
  fs.writeFile(DATA_PATH, JSON.stringify(data), err => err && console.error(err))
}, 5000)

export default data
