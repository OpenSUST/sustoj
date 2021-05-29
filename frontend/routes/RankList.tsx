/* eslint-disable multiline-ternary */
/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from 'react'
import TimeAgo from 'timeago-react'
import io from '../io'

import useToken from '../token'
import { getProblemText } from '../utils'

export interface UserData {
  name: string
  star?: true
  penalty: number
  solved: number
  problems: Record<number, { solvedTime?: number, try: number, pending?: true, hash?: string } | undefined>
  submits: Array<{ time: number, id: number, status: string }>
}

const sort = ([, a], [, b]) => a.solved > b.solved ? -1 : a.solved === b.solved ? a.penalty - b.penalty : 1

let flag = 0
const RankList: React.FC = () => {
  const [showStared, setShowStared] = useState(false)
  const [problems, setProblems] = useState<JSX.Element[]>([])
  const [, update] = useState(0)
  const [userData, setUserData] = useState<Record<string, UserData>>({})
  const token = useToken()
  const userId = localStorage.getItem('username')
  const len = problems.length
  const downloadData = () => {
    if (!userData) return
    let data = 'data:text/csv;charset=utf-8,\uFEFF排名,名字,ID,题数,罚时'
    for (let i = 0; i < len; i++) data += ',' + getProblemText(i)
    Object.entries(userData).sort(sort).forEach(([key, it], i) => {
      data += `\n${i + 1},${it.name},${key},${it.solved},${it.penalty}`
      for (let i = 0; i < len; i++) data += ',' + (it.problems[i]?.hash || '')
    })
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(data))
    link.setAttribute('download', '数据.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
  useEffect(() => {
    const f = (id: string, data: UserData) => {
      if (!userData[id]) userData[id] = data
      else Object.assign(userData[id], data)
      update(flag++)
    }
    io.on('rankListUpdate', f).emit('rankList', token, (length: number, b: Record<string, [string] | string>, c: Record<string, UserData>, user?: string, d?: UserData) => {
      setProblems(Array.from({ length }, (_, i) => <th key={i}>{getProblemText(i)}题</th>))
      for (const key in c) {
        const it = b[key]
        if (typeof it === 'string') c[key].name = it
        else {
          c[key].name = it[0]
          c[key].star = true
        }
      }
      if (d && user) {
        if (!c[user]) c[user] = d
        else Object.assign(c[user], d)
        if (!c[user].name) c[user].name = typeof b[user] === 'string' ? b[user] as string : b[user][0]
      }
      setUserData(c)
    })
    return () => void io.off('rankListUpdate', f).emit('leaveRankList')
  }, [token])
  return (<div className='paper'>
    <h1 style={{ display: 'inline' }}>排名</h1>
    <span>(比赛结束一小时前封榜)</span>
    <button className='data-download' onClick={downloadData}>下载数据</button>
    <fieldset className='form-group' style={{ margin: '12px 0 0' }}>
      <label htmlFor='show-stared' className='paper-check'>
        <input type='checkbox' id='show-stared' checked={showStared} onChange={() => setShowStared(!showStared)} /> <span>显示不参与排名的小朋友们</span>
      </label>
    </fieldset>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>名字</th>
          <th>题数</th>
          <th>罚时</th>
          {problems}
        </tr>
      </thead>
      <tbody>
        {userData && Object.entries(userData)
          .sort(sort)
          .filter(([, it]) => !it.star || showStared)
          .map(([key, value], i) => <tr key={key}>
            <td>{i + 1}</td>
            <td popover-left={key} className={key === userId ? 'background-secondary' : undefined}>{value.name}{key === userId && ' (我)'}</td>
            <td>{value.solved}</td>
            <td>{value.penalty}</td>
            {Array.from({ length: len }, (_, i) => {
              const it = value.problems[i]
              if (!it) return <td key={i} />
              const solved = it.solvedTime
              return <td key={i} className={solved ? 'background-success' : it.pending ? 'background-secondary' : it.try ? 'background-danger' : undefined}>{solved
                ? <><TimeAgo datetime={solved} locale='zh_CN' />{it.try > 1 && <> (-{it.try - 1})</>}</> : `(-${it.try})`}</td>
            })}
          </tr>)}
      </tbody>
    </table>
  </div>)
}

export default RankList
