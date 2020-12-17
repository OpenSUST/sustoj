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
