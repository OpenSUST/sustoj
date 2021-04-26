import 'papercss/dist/paper.css'
import './index.css'
// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Countdown from 'react-countdown'
import { HashRouter, Route, Link } from 'react-router-dom'

import Home from './routes/Home'
import Problem from './routes/Problem'
import RankList from './routes/RankList'
import Submits from './routes/Submits'

import io from './io'
import { Context } from './token'
import { Context as StartedContext } from './started'
import { alert } from './utils'

window.started = false

try {
  document.title = require('../name.js')
} catch { }

const App: React.FC = () => {
  const [flag, setFlag] = useState(0)
  const [name, setName] = useState('')
  const [token, setToken] = useState<string>(null)
  const login = (username: string | undefined, password: string | undefined, showAlert = true) => io.emit('login', username, password, (err, name, token) => {
    if (!username || !password) return
    if (err) {
      localStorage.removeItem('username')
      localStorage.removeItem('password')
      if (showAlert) alert(err, true, 'danger')
      return
    }
    setName(name)
    setToken(token)
    localStorage.setItem('username', username)
    localStorage.setItem('password', password)
    if (showAlert) alert('登陆成功!', true)
  })
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [config, setConfig] = useState<{ title: string, start: number, end: number, now: number }>(null)
  useEffect(() => {
    const f = data => {
      data.now = Date.now()
      window.started = data.start < data.now && data.now < data.end
      setFlag(data.now)
      setConfig(data)
    }
    io.on('init', f)
    const user = localStorage.getItem('username')
    if (user) login(user, localStorage.getItem('password'), false)
    return () => void io.off('init', f)
  }, [])
  return (<HashRouter>
    <Context.Provider value={token}>
      <StartedContext.Provider value={flag}>
        <nav className='border fixed split-nav'>
          <div className='nav-brand' style={{ display: 'flex', alignItems: 'center' }}>
            <h3 style={{ display: 'inline' }}><Link to='/'>{document.title}</Link></h3>
            <span>&nbsp;&nbsp;{config && config.title}</span>
          </div>
          {config && <div className='countdown'>{config.now < config.end
            ? <>倒计时:&nbsp;
              <Countdown
                date={config.now < config.start ? config.start : config.end}
                onComplete={() => {
                  config.now = Date.now()
                  const notEnded = config.now < config.end
                  setConfig({ ...config })
                  window.started = config.start < config.now && notEnded
                  if (!notEnded) alert('比赛已结束!', false)
                  setFlag(config.now)
                }}
              /></>
            : <>比赛已结束!</>}</div>}
          <div className='collapsible'>
            <div className='collapsible-body'>
              <ul className='inline' style={{ marginTop: 0 }}>
                <li><Link to='/ranklist'>排名</Link></li>
                <li><Link to='/submits'>我的提交</Link></li>
                <li><h4 style={{ margin: 0 }}><label className='badge secondary shadow shadow-small shadow-hover' htmlFor={name ? 'logout-modal' : 'login-modal'} style={{ color: '#FFF' }}>{name || '点此登录'}</label></h4></li>
              </ul>
            </div>
          </div>
        </nav>
        <main>
          <Route path='/' exact component={Home} />
          <Route path='/problem/:id' exact component={Problem} />
          <Route path='/ranklist' exact component={RankList} />
          <Route path='/submits' exact component={Submits} />
        </main>
        <input className='modal-state' id='login-modal' type='checkbox' />
        <div className='modal'>
          <label className='modal-bg' htmlFor='login-modal' />
          <div className='modal-body'>
            <label className='btn-close' htmlFor='login-modal'>X</label>
            <h4 className='modal-title'>登录窗口</h4>
            <div className='form-group'>
              <input placeholder='用户名' value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className='form-group'>
              <input type='password' placeholder='密码' value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <label
              htmlFor={username && password ? 'login-modal' : undefined}
              className={'paper-btn btn-secondary center-btn' + (username && password ? '' : ' disabled')}
              onClick={() => login(username, password)}
            >登录!</label>
          </div>
        </div>
        <input className='modal-state' id='logout-modal' type='checkbox' />
        <div className='modal'>
          <label className='modal-bg' htmlFor='logout-modal' />
          <div className='modal-body'>
            <label className='btn-close' htmlFor='logout-modal'>X</label>
            <h4 className='modal-title'>确认退出登录?</h4>
            <label
              htmlFor='logout-modal'
              className='paper-btn btn-danger'
              onClick={() => {
                localStorage.removeItem('username')
                localStorage.removeItem('password')
                setUsername('')
                setPassword('')
                setToken(null)
                setName('')
              }}
            >退出登录!</label>
            <label htmlFor='logout-modal' className='paper-btn' style={{ marginLeft: 20 }}>取消</label>
          </div>
        </div>
      </StartedContext.Provider>
    </Context.Provider>
  </HashRouter>)
}

ReactDOM.render(<App />, document.getElementById('root'))
