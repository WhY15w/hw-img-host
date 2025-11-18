/**
 *
 * @param {*} code 响应码
 * @param {*} msg 响应消息
 * @param {*} data 相应数据
 * @returns json
 */

const reply = (code: number, msg: string, data) => {
  return {
    code,
    msg,
    data,
  }
}

export { reply }
