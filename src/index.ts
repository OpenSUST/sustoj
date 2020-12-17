import socketIO from 'socket.io'
import Koa from 'koa'
import jwt from 'jsonwebtoken'
import Pool from './pool'
import { AddressInfo } from 'net'
import { users, problems, config, secret } from './init'
import { createServer } from 'http'
import data, { update, problemsData } from './data'

const IS_DEV = process.env.NODE_ENV !== 'production'

const workers = new Pool<socketIO.Socket>()

const app = new Koa()
const server = createServer(app.callback())
const io = new socketIO.Server(server, {
  serveClient: false,
  // eslint-disable-next-line multiline-ternary
  cors: IS_DEV ? {
    origin: 'http://127.0.0.1:1234',
    methods: ['GET', 'POST']
  } : undefined
})

let started = false
setTimeout(() => {
  const now = Date.now()
  started = now > config.start && now < config.end
}, 10000)

io.on('connection', (it: socketIO.Socket) => {
  let isWorker = false
  it
    .on('worker-login', (token, count = 1, reply) => {
      if (token !== secret) {
        reply('The secret is not correct!')
        return
      }
      console.log('Worker login:', (it.client.request.socket.address() as AddressInfo).address)
      isWorker = true
      reply(problems)
      while (count-- > 0) workers.add(it)
    })
    .on('login', (username: string, password: string, reply) => {
      if (!(username in users) || users[username].password !== password) {
        reply('账号或密码错误!')
        return
      }
      reply(null, users[username].name, jwt.sign(username, secret))
    })
    .on('getProblems', reply => {
      reply(problemsData)
      it.in('problems').emit('problemsStatus', data.problemsStatus)
    })
    .on('submit', (token = '', id, lang, code, reply) => {
      if (!token) {
        reply('你还没有登录!')
        return
      }
      if (!started) {
        reply('比赛没有开始!')
        return
      }
      if (!problems[id]) {
        reply('找不到这道题!')
        return
      }
      const user = jwt.verify(token, secret) as string | null
      if (!user) {
        reply('登录已失效!')
        return
      }
      switch (lang) {
        case 'c': case 'cpp': case 'java': case 'python':
          workers.acquire()
            .then(it => it.emit('run', id, lang, code, (status: string, message: string) => {
              workers.add(it)
              const problemStatus = data.problemsStatus[id] || (data.problemsStatus[id] = [0, 0])
              problemStatus[1]++
              const userData = data.userData[user] || (data.userData[user] = { penalty: 0, solved: 0, problems: { }, submits: [] })
              const problem = userData.problems[id] || (userData.problems[id] = { try: 0 })
              const time = Date.now()
              userData.submits.unshift({ time, status, code })
              if (!problem.solvedTime) {
                problem.try++
                if (status === 'SUCCESS') {
                  userData.solved++
                  problemStatus[0]++
                  problem.solvedTime = time
                  userData.penalty += time - config.start
                  userData.penalty += 20 * 60 * 1000 * (problem.try - 1)
                }
              }
              update()
              reply(null, status, message)
              io.in('problems').emit('problemsStatus', data.problemsStatus)
            }))
          break
        default:
          reply('语言不正确!')
      }
    })
    .on('getProblem', (id, reply) => {
      if (!started) {
        reply('比赛没有开始!')
        return
      }
      if (!problems[id]) {
        reply('找不到这道题!')
        return
      }
      reply(null, problems[id].description)
    })
    .on('disconnect', it => isWorker && workers.remove(it))
  io.emit('init', config)
})
server.listen(23333)
