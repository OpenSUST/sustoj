import * as lzma from 'lzma-native'
import fs from 'fs'
import filesize from 'filesize'
import { problems, users } from './init'
import { Data } from './types'
import { createHash } from 'crypto'

const DATA_PATH = 'competition/data.json'
const LOCKED_DATA_PATH = 'competition/lockedData.json'
const COMPRESSED_PROBLEMS_PATH = 'competition/compressedProblems'
export const problemsData = problems.map(it => it.config)
export const userIdMap: Record<string, [string] | string> = { }
const data: Data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
let lockedData: Data = fs.existsSync(LOCKED_DATA_PATH) ? JSON.parse(fs.readFileSync(LOCKED_DATA_PATH, 'utf8')) : null

export const getLockedData = () => lockedData

export const lock = () => {
  const d = JSON.stringify(data)
  lockedData = JSON.parse(d)
  fs.promises.writeFile(LOCKED_DATA_PATH, d).catch(console.error)
}

for (const id in users) userIdMap[id] = users[id].star ? [users[id].name] : users[id].name

let updated = false
export const update = () => { updated = true }

const updateNow = () => {
  if (!updated) return
  updated = false
  fs.writeFile(DATA_PATH, JSON.stringify(data), err => err && console.error(err))
}

setInterval(updateNow, 5000)

const problemsBuffer = Buffer.from(JSON.stringify(problems))
export const problemsHash = createHash('sha256').update(problemsBuffer).digest('hex')
export let problemsCompressedData = fs.existsSync(COMPRESSED_PROBLEMS_PATH) ? fs.readFileSync(COMPRESSED_PROBLEMS_PATH) : null
if (!problemsCompressedData || data.problemsHash !== problemsHash) {
  problemsCompressedData = null
  console.log('Compressing...')
  lzma.compress(problemsBuffer, 9, it => {
    problemsCompressedData = it
    fs.writeFile(COMPRESSED_PROBLEMS_PATH, it, err => err && console.error(err))
    data.problemsHash = problemsHash
    update()
    updateNow()
    console.log('Compressed:', filesize(it.length))
  })
}

export default data
