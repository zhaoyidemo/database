// API 配置
// 生产环境使用相对路径（通过服务器代理），开发环境直接访问
const isDev = import.meta.env.DEV
export const API_BASE_URL = isDev ? 'http://47.116.208.226:9000/api' : '/api'

// API 端点
export const API_ENDPOINTS = {
  dashboard: `${API_BASE_URL}/dashboard`,
  trends: `${API_BASE_URL}/trends`,
  ratingsTrend: `${API_BASE_URL}/ratings/trend`,
  thumbsdownTrend: `${API_BASE_URL}/thumbsdown/trend`,
  abComparison: `${API_BASE_URL}/ab-comparison`
}
