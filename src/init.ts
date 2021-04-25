/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import { Data, Problem } from './types'

if (!fs.existsSync('competition')) fs.mkdirSync('competition')
if (!fs.existsSync('competition/static')) fs.mkdirSync('competition/static')
if (!fs.existsSync('competition/submits')) fs.mkdirSync('competition/submits')
if (!fs.existsSync('competition/problems')) fs.mkdirSync('competition/problems')
if (!fs.existsSync('competition/problems/0')) fs.mkdirSync('competition/problems/0')
if (!fs.existsSync('competition/problems/0/data')) fs.mkdirSync('competition/problems/0/data')

;([
  ['competition/data.json', { problemsStatus: { }, userData: { }, submitId: 0 } as Data],
  ['competition/config.json', {
    title: '测试赛',
    timeLimit: 1000,
    memoryLimit: 256,
    start: Date.now(),
    end: Date.now() + 4 * 60 * 60 * 1000,
    secret: Math.random().toString(36).slice(2)
  }],
  ['competition/users.json', { admin: { name: '管理员', password: Math.random().toString(36).slice(2), star: true } }],
  ['competition/announcement.md', ''],
  ['competition/problems/0/index.md', `# Test

## Description

Please output $x$ "Hello World!".

## Input

An integer representing $x$.

\`\`\`
3
\`\`\`

## Output

\`\`\`
Hello World!
Hello World!
Hello World!
\`\`\`
`],
  ['competition/problems/0/data/input.txt', '3\n'],
  ['competition/problems/0/data/output.txt', 'Hello World!\nHello World!\nHello World!\n'],
  ['competition/problems/0/index.json', { title: 'Test', tags: ['Easy'] }]
] as Array<[string, unknown]>)
  .forEach(([file, defaults]) => !fs.existsSync(file) && fs.writeFileSync(file, typeof defaults === 'string' ? defaults : JSON.stringify(defaults)))

export const config: {
  title: string
  start: number
  end: number
  timeLimit: number
  memoryLimit: number
} = JSON.parse(fs.readFileSync('competition/config.json', 'utf8'))
export const secret: string = (config as any).secret
// eslint-disable-next-line prefer-reflect
delete (config as any).secret
export const users: Record<string, { name: string, password: string, star?: boolean }> = JSON.parse(fs.readFileSync('competition/users.json', 'utf8'))
export const problems: Problem[] = fs.readdirSync('competition/problems').sort((a, b) => +a - +b).map(it => {
  const path = 'competition/problems/' + it + '/'
  const dataPath = path + 'data/'
  const inputs = fs.readdirSync(dataPath).filter(it => it.includes('in'))
  return {
    config: Object.assign({ time: config.timeLimit, memory: config.memoryLimit }, JSON.parse(fs.readFileSync(path + 'index.json', 'utf8'))),
    inputs: inputs.map(it => fs.readFileSync(dataPath + it, 'utf8')),
    outputs: inputs.map(it => fs.readFileSync(dataPath + it.replace('in', 'out'), 'utf8')),
    description: fs.readFileSync(path + 'index.md', 'utf8')
  }
})

export const announcement = fs.existsSync('competition/announcement.md') ? fs.readFileSync('competition/announcement.md', 'utf8') : ''
