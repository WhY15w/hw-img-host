/**
 * 统一响应格式
 * @param {*} code 响应码
 * @param {*} msg 响应消息
 * @param {*} data 相应数据
 * @returns json
 */
const reply = (code: number, msg: string, data?: unknown) => {
  return {
    code,
    msg,
    data,
  }
}

export { reply }
