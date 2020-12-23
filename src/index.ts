import socketIO from 'socket.io'
import Koa from 'koa'
import jwt from 'jsonwebtoken'
import Pool from './pool'
import { users, problems, config, secret } from './init'
import { createServer } from 'http'
import { promises as fsp } from 'fs'
import data, { update, problemsData, userIdMap } from './data'

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
const check = () => {
  const now = Date.now()
  started = now > config.start && now < config.end
}
check()
setTimeout(check, 10000)

io.on('connection', (it: socketIO.Socket) => {
  let isWorker = false
  it
    .on('worker-login', (token, count = 1, reply) => {
      if (!reply) return
      if (token !== secret) {
        reply('The secret is not correct!')
        it.disconnect(true)
        return
      }
      console.log('Worker connected:', it.client.request.socket.remoteAddress)
      isWorker = true
      reply(null, problems)
      while (count-- > 0) workers.add(it)
    })
    .on('login', (username: string, password: string, reply) => {
      if (!reply) return
      if (!(username in users) || users[username].password !== password) {
        reply('账号或密码错误!')
        return
      }
      reply(null, users[username].name, jwt.sign(username, secret))
    })
    .on('getProblems', reply => {
      if (!reply) return
      reply(problemsData)
      it.join('home')
      it.emit('problemsStatus', data.problemsStatus)
    })
    .on('leaveHome', () => it.leave('home'))
    .on('rankList', reply => {
      if (!reply) return
      it.join('rankList')
      reply(problemsData.length, userIdMap, data.userData)
    })
    .on('leaveRankList', () => it.leave('rankList'))
    .on('mySubmits', (token: string, reply) => {
      if (!reply) return
      if (!token) {
        reply('你还没有登录!')
        return
      }
      const user = jwt.verify(token, secret) as string | null
      if (!user) {
        reply('登录已失效!')
        return
      }
      reply(null)
      it.emit('submits', data.userData[user].submits)
    })
    .on('submit', (token = '', id: number, lang: string, code: string, reply) => {
      if (!reply) return
      if (!token) {
        reply('你还没有登录!')
        return
      }
      if (!started) {
        reply('比赛没有开始!')
        return
      }
      if (!workers.workers.length) {
        reply('当前没有任何在线的评测机!')
        return
      }
      if (!code || code.length > 1024 * 1024) {
        reply('代码过长!')
        return
      }
      id = +id
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
        case 'c': case 'cpp': case 'java': case 'python': {
          const problemStatus = data.problemsStatus[id] || (data.problemsStatus[id] = [0, 0])
          problemStatus[1]++
          const userData = data.userData[user] || (data.userData[user] = { penalty: 0, solved: 0, problems: { }, submits: [] })
          const problem = userData.problems[id] || (userData.problems[id] = { try: 0 })
          const time = Date.now()
          const submitId = data.submitId++
          const submit = { time, status: 'PENDING', id: submitId, problem: id }
          problem.pending = true
          userData.submits.unshift(submit)
          update()
          io.in('rankList').emit('rankListUpdate', user, userData)
          it.emit('submits', userData.submits)
          fsp.writeFile('competition/submits/' + submitId, code).catch(console.error)
          workers.acquire()
            .then(it => it.emit('run', id, lang, code, (status: string, message: string) => {
              if (!it.disconnected) workers.add(it)
              problem.try++
              // eslint-disable-next-line prefer-reflect
              delete problem.pending
              submit.status = status
              if (status === 'ACCEPTED') {
                problemStatus[0]++
                if (!problem.solvedTime) {
                  userData.solved++
                  problem.solvedTime = time
                  userData.penalty += time - config.start
                  userData.penalty += 20 * 60 * 1000 * (problem.try - 1)
                }
              }
              update()
              reply(null, status, message)
              io.in('home').emit('problemsStatus', data.problemsStatus)
              io.in('rankList').emit('rankListUpdate', user, userData)
              it.emit('submits', userData.submits)
            }))
          break
        }
        default:
          reply('语言不正确!')
      }
    })
    .on('getProblem', (id, reply) => {
      if (!reply) return
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
    .on('disconnect', it => isWorker && workers.remove(it, a => !a.disconnected))
  io.emit('init', config)
})
server.listen(23333)