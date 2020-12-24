/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react'
import TimeAgo from 'timeago-react'

import io from '../io'
import useToken from '../token'
import { getStatusText, getProblemText, alert, copy } from '../utils'

const Submits: React.FC = () => {
  const [submits, setSubmits] = useState<Array<{ time: number, id: number, status: string, problem: number }>>([])
  const token = useToken()
  useEffect(() => {
    io.on('submits', setSubmits)
    if (token) io.emit('mySubmits', token, err => err && console.error(err))
    return () => io.off('submits', setSubmits)
  }, [token])
  return (<div className='paper submits'>
    <h1 style={{ margin: 0 }}>我的提交</h1>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>题号</th>
          <th>提交时间</th>
          <th>结果</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {submits.map((it, i) => <tr key={it.time}>
          <td>{i + 1}</td>
          <td>{getProblemText(it.problem)}</td>
          <td><TimeAgo datetime={it.time} locale='zh_CN' /></td>
          <td className={it.status === 'ACCEPTED' ? 'background-success' : it.status === 'PENDING' ? 'background-secondary' : 'background-danger'}>{getStatusText(it.status)}</td>
          <td><a onClick={() => io.emit('getCode', token, it.id, (err, code) => err ? alert(err, true, 'danger') : copy(code))}>复制代码</a></td>
        </tr>)}
      </tbody>
    </table>
  </div>)
}

export default Submits
