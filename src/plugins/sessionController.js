class SessionController {
  constructor(type) {
    const { NODE_ENV, VITE_APP_KEY } = import.meta.env
    const typeArray = [`${VITE_APP_KEY}_SYSTEM`, `${VITE_APP_KEY}_USER`, `${VITE_APP_KEY}_SET`, `${VITE_APP_KEY}_STOR`]
    this.env = NODE_ENV
    this.type = typeArray.includes(type) ? type : false
  }

  _utf8ToB64(str) {
    if (this.env === 'production') return window.btoa(encodeURIComponent(str))
    return str
  }

  _b64ToUtf8(str) {
    if (this.env === 'production') return decodeURIComponent(window.atob(str))
    return str
  }

  _hasStorage() {
    return sessionStorage.getItem(this.type) ? JSON.parse(this._b64ToUtf8(sessionStorage.getItem(this.type))) : false
  }

  _initStorage() {
    const storage = this._hasStorage()
    if (!storage) {
      sessionStorage.setItem(this.type, this._utf8ToB64(JSON.stringify({ init: true })))
      return { init: true }
    }
    return storage
  }

  // ========= 以上為私有方法 ==========

  get(key) {
    if (!this.type) return false

    const storage = this._initStorage()
    // 查詢session物件本身
    if (this.type === key) {
      return !storage
        ? // eslint-disable-next-line
          console.log(`SessionController : ${this.type} is not found in sessionStorage`)
        : storage
    }
    // 查詢session物件裡的欄位
    const field = storage[key]
    return !field ? false : field
  }

  set(key, value) {
    if (!this.type) return

    let storage = this._initStorage()
    // 對session物件本身做新增
    if (this.type === key) storage = value
    // 對session物件裡的屬性做新增
    else storage[key] = value
    sessionStorage.setItem(this.type, this._utf8ToB64(JSON.stringify(storage)))
  }

  delete(key) {
    if (!this.type) return

    // 刪除session物件本身
    if (this.type === key) sessionStorage.removeItem(this.type)
    // 刪除session物件裡的屬性
    else {
      const storage = this._initStorage()
      delete storage[key]
      sessionStorage.setItem(this.type, this._utf8ToB64(JSON.stringify(storage)))
    }
  }
}

export default SessionController
