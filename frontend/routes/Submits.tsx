// eslint-disable-next-line no-use-before-define
import React from 'react'

const RankList: React.FC = () => {
  return (<div className='paper'>
    <h1 style={{ margin: 0 }}>我的提交</h1>
    <table>
      <thead>
        <tr>
          <th>提交时间</th>
          <th>题号</th>
          <th>结果</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Bob Dylan</td>
          <td>Musician</td>
          <td>California, USA</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Eric Clapton</td>
          <td>Musician</td>
          <td>Ohio, USA</td>
        </tr>
        <tr>
          <td>3</td>
          <td>Daniel Kahneman</td>
          <td>Psychologist</td>
          <td>California, USA</td>
        </tr>
      </tbody>
    </table>
  </div>)
}

export default RankList
