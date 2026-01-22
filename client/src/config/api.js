// API 配置
// 真实后端 API 地址
export const API_BASE_URL = 'http://47.116.208.226:9000/api'

// API 端点
export const API_ENDPOINTS = {
  dashboard: `${API_BASE_URL}/dashboard`,
  trends: `${API_BASE_URL}/trends`,
  ratingsTrend: `${API_BASE_URL}/ratings/trend`,
  thumbsdownTrend: `${API_BASE_URL}/thumbsdown/trend`,
  abComparison: `${API_BASE_URL}/ab-comparison`
}
