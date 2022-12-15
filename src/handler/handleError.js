export default err => {
  const { data } = err.response
  const { ResultCode, Message } = data

  let status = ''
  switch (ResultCode) {
    case '02':
      status = 440.2
      break
    case '03':
      status = 401.3
      break
    case '04':
      status = 400.4
      break
    case '05':
      status = 401.5
      break
    case '06':
      status = 403.6
      break
    default:
      status = err.response.status || ''
      break
  }

  err.statusCode = status
  err.data = status ? data : {}

  switch (status) {
    case 200:
      err.message = '系統響應錯誤。' // 錯誤響應也會有狀態碼為200的情況
      break
    case 400:
      err.message = '請求錯誤(400)'
      break
    case 400.901:
      err.message = '已拒絕客戶端同時且連續發送相同的請求。' // 連續相同請求 (.9** 僅前端自訂收錄)
      break
    case 400.4:
      err.message = `${Message}(400.4)` // API 回應傳參錯誤(原則上http為200因此不會進到這裡)
      break
    case 401:
      err.message = '您尚未登入或系統連線逾時，請重新登入(401)'
      break
    case 401.3:
      err.message = `${Message}(401.3)` // API 401 回應token失效
      break
    case 401.5:
      err.message = `${Message}(401.5)` // API 401 回應重複登入
      break
    case 403:
      err.message = '拒絕訪問(403)'
      break
    case 403.6:
      err.message = `${Message}(403.6)` // API 403 回應未授權
      break
    case 404:
      err.message = '請求出錯(404)'
      break
    case 405:
      err.message = '請求方法錯誤(405)'
      break
    case 408:
      err.message = '請求超時(408)'
      break
    case 440:
      err.message = '系統連線逾時，請重新登入(440)'
      break
    case 440.2:
      err.message = `${Message}(440.2)` // API 401 回應逾時
      break
    case 500:
      err.message = '服務器錯誤(500)'
      break
    case 501:
      err.message = '服務未實現(501)'
      break
    case 502:
      err.message = '網路錯誤(502)'
      break
    case 503:
      err.message = '服務不可用(503)'
      break
    case 504:
      err.message = '網路超時(504)'
      break
    case 505:
      err.message = 'HTTP版本不受支持(505)'
      break
    default:
      err.message = `系統連線異常(${err.response.status})，請稍後再試。`
  }

  if (!status) {
    err.message = '系統無響應狀態碼。' // 有response但没有response.status的情况
  }

  return err
}
