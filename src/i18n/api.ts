export const apiRetryMessage = '操作过于频繁，请在 {seconds} 秒后重试。'
export const apiMessages = {
  storage: '无法保存登录校验状态，请允许 sessionStorage 后重试。',
  insufficientPoints: '积分不足，请先签到或减少消费。',
  alreadySigned: '尚未到下次签到时间，请稍后重试。',
  pluginDenied: '操作被站点插件规则拒绝，请修改输入或联系管理员。',
  unauthorized: '登录已失效，请重新登录。',
  forbidden: '账号或密码不正确，或当前账号没有操作权限。',
  missing: '内容不存在或已被下架，请返回列表。',
  conflict: '内容已存在或状态已变更，请刷新后重试。',
  quota: '文件过大或存储额度不足，请缩小文件或清理上传。',
  rateLimit: '操作过于频繁，请稍后重试。',
  validation: '提交内容不符合要求，请检查输入。',
  server: '服务暂时不可用，请稍后重试。',
  network: '无法连接服务，请检查网络后重试。',
  timeout: '请求超时，请稍后重试。',
  aborted: '请求已取消。',
  response: '服务返回的数据不完整，请刷新后重试。',
}
