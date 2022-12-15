/* eslint-disable no-console */
export default response => {
  const { status, data, config } = response
  const { ResultCode, Message, MessageType } = data
  // 如果http響應狀態碼response.status正常，則直接返回數據
  if ((status >= 200 && status <= 300) || status === 304) {
    const color = 'background-color: #ffffee; color: #f0ac00;'
    switch (data.ResultCode) {
      case '00': {
        // 00 成功
        if (MessageType !== '01') {
          console.group(`%cAPI Error MessageType: ${MessageType}`, color)
          console.warn(`Exception occurred: ${Message}`)
          console.warn(`Request URL: ${config.url}`)
          console.groupEnd()
        }
        break
      }
      case '04': {
        // 04 傳入參數錯誤
        console.group('%cAPI Error Code: 04 傳入參數錯誤', color)
        console.warn(`Exception occurred: ${Message}`)
        console.warn(`Request URL: ${config.url}`)
        console.groupEnd()
        break
      }
      default: {
        console.group(`%cAPI Error Code: ${ResultCode}`, color)
        console.warn(`Exception occurred: ${Message}`)
        console.warn(`Request URL: ${config.url}`)
        console.groupEnd()
        break
      }
    }

    return response
  }

  return {
    code: status,
    message: `例外錯誤:${Message}`,
  }
}
