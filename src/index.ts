import socketIO from 'socket.io'
import Koa from 'koa'
import jwt from 'jsonwebtoken'
import Pool from './pool'
import serve from 'koa-static'
import { users, problems, config, secret, announcement } from './init'
import { createServer } from 'http'
import { promises as fsp } from 'fs'
import { createHash } from 'crypto'
import data, { update, problemsData, userIdMap, getLockedData, lock, problemsCompressedData, problemsHash } from './data'

const IS_DEV = process.env.NODE_ENV !== 'production'

const workers = new Pool<socketIO.Socket>()

const app = new Koa()
app.use(serve('dist'))
app.use(serve('competition/static'))
const server = createServer(app.callback())
const io = new socketIO.Server(server, {
  serveClient: false,
  pingTimeout: 40000,
  // eslint-disable-next-line multiline-ternary
  cors: IS_DEV ? {
    origin: 'http://127.0.0.1:1234',
    methods: ['GET', 'POST']
  } : undefined
})

let started = false
let isLocked = false
let notFinished = false
const check = () => {
  const now = Date.now()
  notFinished = now < config.end
  isLocked = now > config.end - 60 * 60 * 1000 && notFinished
  started = now > config.start && notFinished
  if (!getLockedData() && isLocked) lock()
}
check()
setInterval(check, 10000)

io.on('connection', (it: socketIO.Socket) => {
  let isWorker = false
  it
    .on('worker-login', (token, count = 1, reply) => {
      if (!reply || !problemsCompressedData) {
        it.disconnect(true)
        return
      }
      if (token !== secret) {
        reply('The secret is not correct!')
        it.disconnect(true)
        return
      }
      isWorker = true
      reply(null, problemsHash)
      console.log('Worker connected:', it.client.request.socket.remoteAddress)
      while (count-- > 0) workers.add(it)
    })
    .on('worker-getProblems', reply => {
      if (!reply || !isWorker || !problemsCompressedData) {
        it.disconnect(true)
        return
      }
      reply(problemsCompressedData)
    })
    .on('login', (username: string, password: string, reply) => {
      if (!reply) return
      const user = users[username]
      if (!user || user.password !== password) {
        reply('账号或密码错误!')
        return
      }
      if (user.star) it.join('star')
      reply(null, user.name, jwt.sign(username, secret))
    })
    .on('getProblems', (token, reply) => {
      if (!reply) return
      reply(problemsData, announcement)
      it.join('home')
      const user = token ? jwt.verify(token, secret) as string | null : null
      it.emit('problemsStatus', !notFinished && isLocked && (!user || !users[user].star) ? getLockedData().problemsStatus : data.problemsStatus)
      if (user && data.userData[user]) it.emit('myProblemsStatus', data.userData[user].problems)
    })
    .on('leaveHome', () => it.leave('home'))
    .on('rankList', (token, reply) => {
      if (!reply) return
      it.join('rankList')
      const user = token ? jwt.verify(token, secret) as string | null : null
      reply(problemsData.length, userIdMap, !notFinished && isLocked && (!user || !users[user].star)
        ? getLockedData().userData
        : data.userData, user, user ? data.userData[user] : null)
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
      it.emit('submits', data.userData[user]?.submits || [])
    })
    .on('getCode', (token, id: number, reply) => {
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
      if (typeof id !== 'number' || isNaN(id) || id < 0 || id >= data.submitId || !data.userData[user] || data.userData[user].submits.every(it => it.id !== id)) {
        reply('错误的提交ID!')
        return
      }
      fsp.readFile('competition/submits/' + id, 'utf8').then(it => reply(null, it), () => reply('发生错误!'))
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
      if (!notFinished) {
        reply('比赛已经结束了!')
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
              if (!problem.solvedTime) problem.try++
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
                  problem.hash = createHash('md5').update(code.replace(/\s/g, '')).digest('hex')
                }
              }
              update()
              reply(null, status, message)
              if (isLocked) {
                io.in('star').in('home').emit('problemsStatus', data.problemsStatus)
                io.in('star').in('rankList').emit('rankListUpdate', user, userData)
              } else {
                io.in('home').emit('problemsStatus', data.problemsStatus)
                io.in('rankList').emit('rankListUpdate', user, userData)
              }
              it.in('home').emit('myProblemsStatus', userData.problems)
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
      reply(null, problems[id].description, problems[id].config)
    })
    .on('disconnect', () => isWorker && workers.remove(it, a => !a.disconnected))
  io.emit('init', config)
})
server.listen(config.port || 13513)
