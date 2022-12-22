/* eslint-disable no-console */
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import request from './request'

dayjs.extend(isBetween)

/**
 * FE00：成功/允許通過
 * FE10：userToken過期
 * FE11：userRefresh失敗
 * FE12：需要但無userToken
 * FE20：sysToken過期 (原則上直接刷新)
 * FE21：sysRefresh失敗
 */

/**
 * 執行檢查Token
 * @returns {Promise<ServiceOperation>}
 * @throws {String} - FE錯誤訊息
 * @memberof ProfileService
 * @param {Object} callerConfig - caller設定檔
 * @param {Object} apiConfig - api設定檔
 * @param {Object} sessionConfig - 已初始session
 */

const tokenChecker = async (callerConfig, apiConfig, sessionConfig) => {
  const timeForCheckToken = dayjs() // tokenChecker 時間點
  const { authKeyName, defaultBaseUrl, defaultHeaders, clientId, callerRefreshSetting, renewalPeriod } = callerConfig
  const { tokenType } = apiConfig
  const { systemAuth, userAuth } = sessionConfig

  const { systemToken, systemTimeExpStart, systemTimeEnd } = systemAuth.get(`${authKeyName}_SYSTEM`)
  const { userToken = '', userRefreshToken = '', userTimeExpStart, userTimeEnd } = userAuth.get(`${authKeyName}_USER`)

  const systemIsExpired = systemToken ? timeForCheckToken.isAfter(systemTimeEnd) : null
  const userIsExpired = userToken ? timeForCheckToken.isAfter(userTimeEnd) : null

  const setSession = (type, config, auth) => {
    const timeForSetSession = dayjs() // setSession 時間點
    const { access_token, expires_in = 300 } = config

    auth.set(`${type}Token`, access_token)
    auth.set(`${type}TimeExpires`, expires_in)
    auth.set(
      `${type}TimeExpStart`,
      timeForSetSession.add(expires_in - renewalPeriod, 'second').format('YYYY-MM-DDTHH:mm:ss'),
    )
    auth.set(`${type}TimeEnd`, timeForSetSession.add(expires_in, 'second').format('YYYY-MM-DDTHH:mm:ss'))

    if (type === 'user') auth.set('userRefreshToken', config.refresh_token)
  }

  const refreshHeaders = {
    'Content-Type': 'application/json',
    'Accept-Language': 'zh-TW',
    'Cache-Control': 'no-store, max-age=0',
  }

  const refreshSystemToken = async () => {
    const timeForRefreshSystemToken = dayjs().format() // refreshSystemToken 時間點
    const { refreshBaseUrl, systemUrl } = callerRefreshSetting
    const { data: systemRefreshData } = await request({
      baseURL: refreshBaseUrl || defaultBaseUrl,
      method: 'POST',
      url: systemUrl,
      headers: {
        ...defaultHeaders,
        ...refreshHeaders,
        Client_Id: clientId,
        'X-Origin-Time': timeForRefreshSystemToken,
      },
      timeout: 15000,
    })
    setSession('system', systemRefreshData, systemAuth)
  }
  const refreshUserToken = async () => {
    const timeForRefreshUserToken = dayjs().format() // refreshUserToken 時間點
    const { refreshBaseUrl, userUrl } = callerRefreshSetting
    const { data: userRefreshData } = await request({
      baseURL: refreshBaseUrl || defaultBaseUrl,
      method: 'POST',
      url: userUrl,
      tokenType: 'user',
      headers: {
        ...defaultHeaders,
        ...refreshHeaders,
        Access_Token: userToken,
        Authorization: `Bearer ${userToken}`,
        Refresh_Token: userRefreshToken,
        'X-Origin-Time': timeForRefreshUserToken,
      },
      timeout: 15000,
    })
    setSession('user', userRefreshData, userAuth)
  }

  // 需要但無userToken
  if (tokenType === 'user' && !userToken) {
    const err = {
      statusCode: 401,
      message: '您尚未登入或系統連線逾時，請重新登入(401)',
      feCode: 'FE12',
    }
    throw err
  }

  /**
   * userToken是否過期
   * 有userToken: true/false
   * 無userToken: null
   */
  if (userIsExpired) {
    const err = {
      statusCode: 440,
      message: '系統連線逾時，請重新登入(440)',
      feCode: 'FE10',
    }
    throw err
  }

  // 過期前30分鐘
  const sysExpSoon = systemToken ? timeForCheckToken.isBetween(systemTimeExpStart, systemTimeEnd) : null
  const userExpSoon = userToken ? timeForCheckToken.isBetween(userTimeExpStart, userTimeEnd) : null

  // 無systemToken 或 systemToken快過期 或 已過期
  if (!systemToken || sysExpSoon || systemIsExpired) {
    try {
      await refreshSystemToken()
    } catch (err) {
      const reason = err.message.split('-')[0]
      if (reason !== '400.901') {
        err.feCode = 'FE21'
        err.message = '系統於刷新連線時發生非預期的錯誤，請稍後再試。'
        throw err
      }
    }
  }

  // userToken快過期
  if (userExpSoon) {
    try {
      await refreshUserToken()
    } catch (err) {
      const reason = err.message.split('-')[0]
      if (reason !== '400.901') {
        err.feCode = 'FE11'
        err.message = '系統於刷新使用者連線時發生非預期的錯誤，請稍後再試。'
        throw err
      }
    }
  }

  return { feCode: 'FE00' }
}

/**
 * 執行請求預處理及後續響應
 * @param {Object} callerConfig - caller設定檔
 * callTokenChecker, authKeyName, defaultBaseUrl, defaultHeaders, clientId ,callerRefreshSetting, renewalPeriod
 *
 * @param {Object} apiConfig - api設定檔
 * url, data, params, tokenType, headers, method, timeout, baseURL
 *
 * @param {Object} sessionConfig - 已初始session
 * systemAuth, userAuth
 *
 * @returns {Object}
 */
const injectRequest = async (callerConfig, apiConfig, sessionConfig) => {
  const requestTimestamp = dayjs().format() // 發送時間點
  try {
    const { callTokenChecker = true, defaultBaseUrl, defaultHeaders, clientId } = callerConfig
    const { url, data, params, tokenType, headers, method, timeout = 15000, baseURL } = apiConfig

    if (callTokenChecker) await tokenChecker(callerConfig, apiConfig, sessionConfig)

    const requestConfig = {
      method: method.toUpperCase(),
      url,
      data,
      params,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'zh-TW',
        'Cache-Control': 'no-store, max-age=0',
        ...defaultHeaders,
        ...headers,
      },
      timeout,
      baseURL: baseURL || defaultBaseUrl, // 特例更改位置使用
    }
    requestConfig.headers['X-Origin-Time'] = requestTimestamp

    if (clientId) requestConfig.headers['Client_Id'] = clientId

    // 在發送請求前加上token
    if (tokenType) {
      const auth = sessionConfig[`${tokenType}Auth`]
      const token = auth.get(`${tokenType}Token`)
      requestConfig.headers.Access_Token = token
      requestConfig.headers.Authorization = `Bearer ${token}`
    }

    const response = await request(requestConfig)
    return {
      statusCode: 200,
      message: '',
      data: response.data,
    }
  } catch (err) {
    const { message = '', statusCode, feCode } = err
    const responseTimestamp = dayjs().format() // 錯誤響應時間點
    console.group('%cAPI 響應攔截錯誤:', 'background-color: #ffeeff; color: #f50057;')
    console.error(`Exception occurred: ${message}`)
    console.error(`Status Code: ${statusCode}`)
    console.error(`Request Method: ${apiConfig.method}`)
    console.error(`Request URL: ${apiConfig.url}`)
    console.error(`Request Timestamp: ${requestTimestamp}`)
    console.error(`Response Timestamp: ${responseTimestamp}`)
    console.error(err)
    console.groupEnd()

    const reason = message.split('-')[0]
    // 一般的請求重複不給過
    if (reason === '400.901') {
      return {
        statusCode: 400.901,
        message: err.message || '已拒絕客戶端同時且連續發送相同的請求。',
        data: null,
      }
    }

    const timeoutList = ['FE10', 'FE12', 'FE20']
    const refreshList = ['FE11', 'FE21']

    // 需登出
    const logoutList = [401, 401.3, 401.5, 403, 403.6, 440, 440.2]
    if (logoutList.includes(statusCode) || timeoutList.includes(feCode) || refreshList.includes(feCode)) {
      sessionStorage.removeItem(`${callerConfig.authKeyName}_USER`)
    }

    // 前端feCode未攔截到的一般錯誤 (實際上可能有來自後端的逾時或刷新失敗)
    if (!timeoutList.includes(feCode) && !refreshList.includes(feCode)) {
      return {
        statusCode,
        message,
        data: null,
      }
    }

    // 以下為由前端透過feCode提前攔截的逾時錯誤或刷新失敗
    return {
      statusCode: 440,
      message,
      data: null,
    }
  }
}

export default injectRequest
