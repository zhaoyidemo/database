import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import InfoTooltip from './InfoTooltip'

function ThumbsDownSection({ data }) {
  const [trendData, setTrendData] = useState([])
  const [viewType, setViewType] = useState('count')

  useEffect(() => {
    fetchTrendData()
  }, [])

  const fetchTrendData = async () => {
    try {
      const response = await fetch('/api/thumbsdown/trend?days=7')
      const result = await response.json()
      setTrendData(result)
    } catch (error) {
      console.error('获取点踩趋势失败:', error)
    }
  }

  if (!data) return null

  return (
    <>
      {/* 核心指标 */}
      <h3 className="subsection-title">3.1 核心指标</h3>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '750px' }}>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="metric-label">
            点踩轮次数
            <InfoTooltip text="被用户点踩的AI回复数量" />
          </div>
          <div className="metric-row">
            <span className="metric-tag">昨日</span>
            <span className="metric-value">{data.count}</span>
          </div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="metric-label">
            点踩人数（去重）
            <InfoTooltip text="至少点踩1次的用户数（去重）" />
          </div>
          <div className="metric-row">
            <span className="metric-tag">昨日</span>
            <span className="metric-value">{data.users}</span>
          </div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="metric-label">
            点踩率
            <InfoTooltip text="公式：点踩轮次数 ÷ 总对话轮次数" />
          </div>
          <div className="metric-row">
            <span className="metric-tag">昨日</span>
            <span className="metric-value">{data.rate}%</span>
          </div>
        </div>
      </div>

      {/* 趋势图 */}
      <h3 className="subsection-title" style={{ marginTop: '24px' }}>3.2 趋势图</h3>
      <div className="chart-toggle">
        <button
          className={viewType === 'count' ? 'active' : ''}
          onClick={() => setViewType('count')}
        >
          轮次数
        </button>
        <button
          className={viewType === 'users' ? 'active' : ''}
          onClick={() => setViewType('users')}
        >
          人数
        </button>
        <button
          className={viewType === 'rate' ? 'active' : ''}
          onClick={() => setViewType('rate')}
        >
          点踩率
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
            <YAxis unit={viewType === 'rate' ? '%' : ''} />
            <Tooltip
              formatter={(value, name) => [
                viewType === 'rate' ? `${value}%` : value,
                name
              ]}
            />
            <Legend />
            {viewType === 'count' && (
              <Line
                type="monotone"
                dataKey="count"
                name="点踩轮次数"
                stroke="#f5576c"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
            {viewType === 'users' && (
              <Line
                type="monotone"
                dataKey="users"
                name="点踩人数（去重）"
                stroke="#764ba2"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
            {viewType === 'rate' && (
              <Line
                type="monotone"
                dataKey="rate"
                name="点踩率(%)"
                stroke="#4facfe"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export default ThumbsDownSection
