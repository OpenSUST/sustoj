/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

import io from '../io'
import useToken from '../token'
import useStarted from '../started'
import { getProblemText } from '../utils'

const Home: React.FC = () => {
  const [announcement, setAnnouncement] = useState('')
  const [problems, setProblems] = useState<{ title: string, tags?: string[] }[]>([])
  const [problemsStatus, setProblemsStatus] = useState<[number, number][]>([])
  const [myProblemsStatus, setMyProblemsStatus] = useState<Record<number, { solvedTime?: number, try: number, pending?: true }>>({})
  const token = useToken()
  useEffect(() => {
    io.on('problemsStatus', setProblemsStatus).on('myProblemsStatus', setMyProblemsStatus).emit('getProblems', token, (problems, announcement) => {
      setProblems(problems)
      setAnnouncement(announcement)
    })
    return () => void io.off('problemsStatus', setProblemsStatus).off('myProblemsStatus', setMyProblemsStatus).emit('leaveHome')
  }, [token])
  useStarted()
  return (<div className='home row flex-spaces flex-middle'>
    {announcement && <div className='card margin-small'>
      <div className='card-body'>
        <h4 className='card-title text-secondary'>公告</h4>
        <div className='card-text'><ReactMarkdown>{announcement}</ReactMarkdown></div>
      </div>
    </div>}
    {problems.map((it, i) => {
      const id = getProblemText(i)
      return <div className='card margin-small' key={i}>
        <div className='card-body'>
          <h4 className={'card-title ' + (myProblemsStatus[i]?.solvedTime ? 'text-success' : myProblemsStatus[i]?.try ? 'text-error' : '')}>{id}. {it.title}</h4>
          <h6 className='text-muted'>通过率: <span className='text-success'>{problemsStatus[i]?.[0] || 0}</span> <span className='text-muted'>/ {problemsStatus[i]?.[1] || 0}</span></h6>
          <p className='card-text'>{it.tags && it.tags.map((tag, i) => (<span key={tag} className={i ? 'badge tag' : 'badge secondary'}>{tag}</span>))}</p>
          {token && window.started && <Link to={'/problem/' + id}><button>让我康康!</button></Link>}
        </div>
      </div>
    })}
  </div>)
}

export default Home
