/* eslint-disable no-param-reassign, no-unused-expressions, no-console */
import axios from 'axios'
import handleError from './handleError'
import handleResponse from './handleResponse'

const request = axios.create()

// 請求中的api
const pendingPool = new Map()

// 請求攔截器配置
const requestInterceptorId = request.interceptors.request.use(
  config => {
    // 對於異常的響應也需要在pendingPool中將其刪除，但響應攔截器中的異常響應有些獲取不到請求信息，這裡將其保存在實例上
    request.config = { ...config }

    config.cancelToken = new axios.CancelToken(cancelFn => {
      pendingPool.has(config.url)
        ? cancelFn(`400.901-請求重複 ${config.url}`)
        : pendingPool.set(config.url, { cancelFn, global: config.global })
    })
    return config
  },
  err => {
    console.group('%cAPI 請求攔截錯誤:', 'background-color: #ffeeff; color: #f50057;')
    console.error(err)
    console.groupEnd()
    return Promise.reject(err)
  },
)
// 響應攔截器配置
const responseInterceptorId = request.interceptors.response.use(
  response => {
    const { config } = response
    pendingPool.delete(config.url)
    return Promise.resolve(handleResponse(response))
  },
  err => {
    const { config } = request
    if (!axios.isCancel(err)) pendingPool.delete(config.url)

    if (!err) return Promise.reject(err)

    if (err.response) {
      err = handleError(err)
      return Promise.reject(err)
    }

    // 錯誤信息err傳入isCancel方法，可以判斷請求是否被取消
    if (axios.isCancel(err)) {
      throw new axios.Cancel(err.message || `請求'${request.config.url}'被取消`)
    } else if (err.stack && err.stack.includes('timeout')) {
      err.message = '請求超時，請重新再試。'
    } else {
      err.message = '系統連線異常，請重新再試。'
    }
    return Promise.reject(err)
  },
)

// 移除全局的請求攔截器
function removeRequestInterceptor() {
  request.interceptors.request.eject(requestInterceptorId)
}

// 移除全局的響應攔截器
function removeResponseInterceptor() {
  request.interceptors.response.eject(responseInterceptorId)
}

/**
 * 清除所有pending狀態的請求
 * @param {Array} whiteList - 白名單，裡面的請求不會被取消
 * @returns {Array} 返回值 被取消了的api請求
 */
function clearPendingPool(whiteList = []) {
  if (!pendingPool.size) return

  // const pendingUrlList = [...pendingPool.keys()].filter((url) => !whiteList.includes(url))
  const pendingUrlList = Array.from(pendingPool.keys()).filter(url => !whiteList.includes(url))
  if (!pendingUrlList.length) return

  pendingUrlList.forEach(pendingUrl => {
    // 清除掉所有非全局的pending狀態下的請求
    if (!pendingPool.get(pendingUrl).global) {
      pendingPool.get(pendingUrl).cancelFn()
      pendingPool.delete(pendingUrl)
    }
  })

  // eslint-disable-next-line
  return pendingUrlList
}

request.removeRequestInterceptor = removeRequestInterceptor
request.removeResponseInterceptor = removeResponseInterceptor
request.clearPendingPool = clearPendingPool

export default request
