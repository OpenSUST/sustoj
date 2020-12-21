/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const alerts = document.getElementById('alerts')

export const alert = (message: string, autoClose = false, type = 'secondary') => {
  let elm = document.createElement('div')
  elm.className = 'alert dismissible alert-' + type
  elm.innerText = message
  const label = document.createElement('label')
  label.className = 'btn-close'
  label.innerText = 'X'
  elm.appendChild(label)
  alerts.appendChild(elm)
  const f = label.onclick = () => {
    if (!elm) return
    elm.remove()
    elm = null
  }
  if (autoClose) setTimeout(f, 5000)
  return () => f
}

const STATUS_TEXT = {
  PENDING: '执行中...',
  ACCEPTED: '通过!',
  TIMEOUT: '运行超时',
  MEMEORY: '内存超限',
  WRONG: '答案错误',
  COMPILE: '编译失败',
  PRESENTATION: '输出格式错误',
  OUTPUT: '输出超限'
}

export const getStatusText = (status: string) => STATUS_TEXT[status] || '未知错误!'
