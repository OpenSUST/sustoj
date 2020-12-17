// eslint-disable-next-line no-use-before-define
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import io from '../io'
import useToken from '../token'
import useStarted from '../started'

const Home: React.FC = () => {
  const [problems, setProblems] = useState<{ title: string, tags?: string[] }[]>([])
  const [problemsStatus, setProblemsStatus] = useState<[number, number][]>([])
  const token = useToken()
  useEffect(() => {
    io.on('problemsStatus', setProblemsStatus).emit('getProblems', setProblems)
    return () => io.off('problemsStatus', setProblemsStatus)
  }, [])
  useStarted()
  return (<div className='home md-3 col'>
    {problems.map((it, i) => (<div className='card' key={i}>
      <div className='card-body'>
        <h4 className='card-title'>{String.fromCharCode(65 + i)}. {it.title}</h4>
        <h6 className='text-muted'>通过率: <span className='text-success'>{problemsStatus[i]?.[0] || 0}</span> <span className='text-muted'>/ {problemsStatus[i]?.[1] || 0}</span></h6>
        <p className='card-text'>{it.tags && it.tags.map((tag, i) => (<span key={tag} className={i ? 'badge tag' : 'badge secondary'}>{tag}</span>))}</p>
        {token && window.started && <Link to={'/problem/' + String.fromCharCode(65 + i)}><button>让我康康!</button></Link>}
      </div>
    </div>))}
  </div>)
}

export default Home
