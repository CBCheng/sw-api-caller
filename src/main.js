import dayjs from 'dayjs'
import injectRequest from './handler/http'
import SessionController from './plugins/sessionController'
class apiCaller {
  /**
   * @param {Object} callerConfig - caller設定檔
   * authKeyName, defaultBaseUrl, clientId ,callerRefreshSetting, renewalPeriod
   */
  constructor(callerConfig) {
    const { authKeyName, renewalPeriod = 1800 } = callerConfig
    this.callerConfig = callerConfig
    this.authKeyName = authKeyName
    this.renewalPeriod = renewalPeriod

    this.systemAuth = new SessionController(`${authKeyName}_SYSTEM`)
    this.userAuth = new SessionController(`${authKeyName}_USER`)
  }

  async sysLogin(apiConfig) {
    const response = await injectRequest(
      { callTokenChecker: false, ...this.callerConfig },
      { ...apiConfig, method: 'post' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )

    if (!response) return null
    if (response.data === null) return response

    const { access_token, expires_in = 300 } = response.data

    const now = dayjs()

    this.systemAuth.set('systemToken', access_token)
    this.systemAuth.set('systemTimeExpires', expires_in)
    this.systemAuth.set(
      'systemTimeExpStart',
      now.add(expires_in - this.renewalPeriod, 'second').format('YYYY-MM-DDTHH:mm:ss'),
    )
    this.systemAuth.set('systemTimeEnd', now.add(expires_in, 'second').format('YYYY-MM-DDTHH:mm:ss'))

    return response
  }
  async userLogin(apiConfig) {
    const response = await injectRequest(
      { callTokenChecker: false, ...this.callerConfig },
      { ...apiConfig, method: 'post' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )

    if (!response) return null
    if (response.data === null) return response

    const { access_token, refresh_token, expires_in = 300 } = response.data
    const now = dayjs()

    this.userAuth.set('userToken', access_token)
    this.userAuth.set('userRefreshToken', refresh_token)
    this.userAuth.set('userTimeExpires', expires_in)
    this.userAuth.set(
      'userTimeExpStart',
      now.add(expires_in - this.renewalPeriod, 'second').format('YYYY-MM-DDTHH:mm:ss'),
    )
    this.userAuth.set('userTimeEnd', now.add(expires_in, 'second').format('YYYY-MM-DDTHH:mm:ss'))

    return response
  }

  async get(apiConfig) {
    return await injectRequest(
      this.callerConfig,
      { ...apiConfig, method: 'get' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )
  }
  async post(apiConfig) {
    return await injectRequest(
      this.callerConfig,
      { ...apiConfig, method: 'post' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )
  }
  async put(apiConfig) {
    return await injectRequest(
      this.callerConfig,
      { ...apiConfig, method: 'put' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )
  }
  async delete(apiConfig) {
    return await injectRequest(
      this.callerConfig,
      { ...apiConfig, method: 'delete' },
      { systemAuth: this.systemAuth, userAuth: this.userAuth },
    )
  }
}

export default apiCaller
