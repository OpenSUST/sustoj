import { problems } from './init'
import fs from 'fs'

const DATA_PATH = 'competition/data.json'
export const problemsData = problems.map(it => it.config)
const data: {
  problemsStatus: Record<number, [number, number]>,
  userData: Record<string, { penalty: number, solved: number, problems: Record<number, { solvedTime?: number, try: number }>, submits: Array<{ time: number, code: string, status: string }> }>
} = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

let updated = false
export const update = () => { updated = true }

setInterval(() => {
  if (!updated) return
  updated = false
  fs.writeFile(DATA_PATH, JSON.stringify(data), err => err && console.error(err))
}, 5000)

export default data
