/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import { Problem } from './types'

if (!fs.existsSync('competition')) fs.mkdirSync('competition')
if (!fs.existsSync('competition/problems')) fs.mkdirSync('competition/problems')
if (!fs.existsSync('competition/problems/0')) fs.mkdirSync('competition/problems/0')

;([
  ['competition/data.json', { problemsStatus: { }, userData: { } }],
  ['competition/config.json', { title: '测试赛', start: Date.now(), end: Date.now() + 4 * 60 * 60 * 100, secret: Math.random().toString(36).slice(2) }],
  ['competition/users.json', { admin: { name: '管理员', password: Math.random().toString(36).slice(2), star: true } }],
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
  ['competition/problems/0/input.txt', '3\n'],
  ['competition/problems/0/output.txt', 'Hello World!\nHello World!\nHello World!\n'],
  ['competition/problems/0/index.json', { title: 'Test', tags: ['Easy'] }]
] as Array<[string, unknown]>)
  .forEach(([file, defaults]) => !fs.existsSync(file) && fs.writeFileSync(file, typeof defaults === 'string' ? defaults : JSON.stringify(defaults)))

export const config: { title: string, start: number, end: number } = JSON.parse(fs.readFileSync('competition/config.json', 'utf8'))
export const secret: string = (config as any).secret
// eslint-disable-next-line prefer-reflect
delete (config as any).secret
export const users: Record<string, { name: string, password: string, star?: boolean }> = JSON.parse(fs.readFileSync('competition/users.json', 'utf8'))
export const problems: Problem[] = fs.readdirSync('competition/problems').sort((a, b) => +a - +b).map(it => {
  const path = 'competition/problems/' + it + '/'
  return {
    config: JSON.parse(fs.readFileSync(path + 'index.json', 'utf8')),
    input: fs.readFileSync(path + 'input.txt', 'utf8'),
    output: fs.readFileSync(path + 'output.txt', 'utf8'),
    description: fs.readFileSync(path + 'index.md', 'utf8')
  }
})
