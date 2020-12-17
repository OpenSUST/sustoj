/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
import 'katex/dist/katex.css'
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import math from 'remark-math'
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light'
import theme from 'react-syntax-highlighter/dist/esm/styles/prism/prism'
import Editor from '@monaco-editor/react'
import { InlineMath, BlockMath } from 'react-katex'
import { useParams } from 'react-router-dom'

import io from '../io'
import useToken from '../token'
import { alert } from '../utils'

(SyntaxHighlighter as any).registerLanguage('c', c)
;(SyntaxHighlighter as any).registerLanguage('cpp', cpp)
;(SyntaxHighlighter as any).registerLanguage('java', java)
;(SyntaxHighlighter as any).registerLanguage('python', python)

const renderers = {
  code: ({ language, value }: { value: string, language: string }) => <SyntaxHighlighter style={theme} language={language}>{value}</SyntaxHighlighter>,
  inlineMath: ({ value }: { value: string }) => <InlineMath math={value} />,
  math: ({ value }: { value: string }) => <BlockMath math={value} />
}

const ProblemPage: React.FC = () => {
  const token = useToken()
  const ref = useRef<() => string>()
  const { id } = useParams<{ id: string }>()
  const [description, setDescription] = useState('')
  useEffect(() => {
    io.emit('getProblem', (id || 'A').charCodeAt(0) - 65, (err, data) => setDescription(err || data))
  }, [id])
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'c')
  return <>
    <div className='problem paper'>
      <article className='article'>
        <ReactMarkdown
          plugins={[math]}
          renderers={renderers}
        >{description}</ReactMarkdown>
      </article>
    </div>
    <input className='modal-state' id='submit-modal' type='checkbox' />
    <div className='modal'>
      <label className='modal-bg' htmlFor='submit-modal' />
      <div className='modal-body'>
        <label className='btn-close' htmlFor='submit-modal'>X</label>
        <h4 className='modal-title'>提交代码: {id} 题</h4>
        <div className='form-group language-selector'>
          <label htmlFor='language-selector' className='modal-subtitle'>请选择语言:</label>
          <select
            id='language-selector'
            value={lang}
            onChange={it => {
              setLang(it.target.value)
              localStorage.setItem('language', it.target.value)
            }}
          >
            <option value='c'>C</option>
            <option value='cpp'>C++</option>
            <option value='java'>Java</option>
            <option value='python'>Python</option>
          </select>
        </div>
        <div className='form-group'><Editor theme='dark' height='50vh' width='80vw' language={lang} editorDidMount={it => (ref.current = it)} /></div>
        <label
          className='paper-btn'
          htmlFor='submit-modal'
          style={{ float: 'right' }}
          onClick={() => {
            if (!token || !window.started || !ref.current) return
            const close = alert('执行中...')
            io.emit('submit', token, (id || 'A').charCodeAt(0) - 65, lang, ref.current(), (err: string | null, status: string, message = '') => {
              close()
              if (err) {
                alert(err, true, 'danger')
                return
              }
              switch (status) {
                case 'SUCCESS':
                  message = '通过!'
                  break
                case 'TIMEOUT':
                  message = '运行超时!'
                  break
                case 'MEMEORY':
                  message = '内存超限!'
                  break
                case 'WRONG':
                  message = '答案错误!'
                  break
                case 'COMPILE':
                  message = '编译失败: ' + message
                  break
                case 'PRESENTATION':
                  message = '输出格式错误!'
              }
              alert(message, false, status === 'SUCCESS' ? 'success' : 'warning')
            })
          }}
        >交一发!</label>
      </div>
    </div>
    {token && window.started && <label htmlFor='submit-modal' className='paper-btn submit' popover-left='点这里提交代码'>提交</label>}
  </>
}

export default ProblemPage
