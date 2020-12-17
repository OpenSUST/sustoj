// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react'

const RankList: React.FC = () => {
  const [showStared, setShowStared] = useState(false)
  return (<div className='paper'>
    <h1 style={{ display: 'inline' }}>排名</h1>
    <span>(比赛结束一小时前封榜)</span>
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
          <th>A题</th>
          <th>B题</th>
          <th>C题</th>
          <th>D题</th>
          <th>E题</th>
          <th>F题</th>
          <th>G题</th>
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
