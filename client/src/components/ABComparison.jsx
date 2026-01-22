import { useState, useEffect } from 'react'
import TimeSelector from './TimeSelector'
import { API_ENDPOINTS } from '../config/api'

function ABComparison({ data: initialData }) {
  const [timeRange, setTimeRange] = useState('7')
  const [abData, setAbData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  // 获取AB对比数据
  const fetchABData = async (days) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.abComparison}?days=${days}`)
      const result = await response.json()
      setAbData(result)
    } catch (error) {
      console.error('获取AB对比数据失败:', error)
    }
    setLoading(false)
  }

  // 处理自定义日期
  const handleCustomDateChange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    fetchABData(days)
  }

  // 监听时间范围变化
  useEffect(() => {
    if (timeRange !== 'custom') {
      fetchABData(timeRange)
    }
  }, [timeRange])

  if (!abData) return null

  const { versionA, versionB } = abData

  const formatDiff = (a, b, isPercentage = false) => {
    const diff = a - b
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : ''
    const sign = diff > 0 ? '+' : ''
    const suffix = isPercentage ? '%' : ''
    const className = diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''
    return (
      <span className={className}>
        {arrow} {sign}{Math.abs(diff).toFixed(isPercentage ? 1 : 0)}{suffix}
      </span>
    )
  }

  const rows = [
    { category: '基础数据', isCategory: true },
    { label: '发起对话人数', a: versionA.conversations, b: versionB.conversations },
    { label: '生成洞察人数', a: versionA.insights, b: versionB.insights },
    { label: '对话轮数', a: versionA.dialogRounds, b: versionB.dialogRounds },
    { label: '评分人数', a: versionA.ratings, b: versionB.ratings },
    { label: '洞察触发率', a: versionA.insightTriggerRate, b: versionB.insightTriggerRate, isPercentage: true },
    { label: '评分率', a: versionA.ratingRate, b: versionB.ratingRate, isPercentage: true },
    { category: '用户评分', isCategory: true },
    { label: '5分人数', a: versionA.fiveStar.count, b: versionB.fiveStar.count },
    { label: '5分占比', a: versionA.fiveStar.percentage, b: versionB.fiveStar.percentage, isPercentage: true },
    { label: '4分人数', a: versionA.fourStar.count, b: versionB.fourStar.count },
    { label: '4分占比', a: versionA.fourStar.percentage, b: versionB.fourStar.percentage, isPercentage: true },
    { label: '低分人数（1-3分）', a: versionA.lowStar.count, b: versionB.lowStar.count },
    { label: '低分占比', a: versionA.lowStar.percentage, b: versionB.lowStar.percentage, isPercentage: true },
    { label: '未评分人数', a: versionA.unrated, b: versionB.unrated },
    { category: '点踩数据', isCategory: true },
    { label: '点踩轮次数', a: versionA.thumbsDownCount, b: versionB.thumbsDownCount },
    { label: '点踩人数（去重）', a: versionA.thumbsDownUsers, b: versionB.thumbsDownUsers },
    { label: '点踩率', a: versionA.thumbsDownRate, b: versionB.thumbsDownRate, isPercentage: true }
  ]

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
          <strong>分组规则：</strong>用户按ID单双号固定分配 |
          <strong> A版：</strong>心理咨询风格 |
          <strong> B版：</strong>教练技术风格
        </p>
        <TimeSelector value={timeRange} onChange={setTimeRange} onCustomDateChange={handleCustomDateChange} />
      </div>

      <div className="table-wrapper" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <table className="ab-table">
        <thead>
          <tr>
            <th>指标</th>
            <th>A版（心理咨询）</th>
            <th>B版（教练技术）</th>
            <th>差值</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (row.isCategory) {
              return (
                <tr key={index} className="category-row">
                  <td colSpan={4}>{row.category}</td>
                </tr>
              )
            }
            return (
              <tr key={index}>
                <td>{row.label}</td>
                <td>{row.a}{row.isPercentage ? '%' : ''}</td>
                <td>{row.b}{row.isPercentage ? '%' : ''}</td>
                <td>{formatDiff(row.a, row.b, row.isPercentage)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}

export default ABComparison
