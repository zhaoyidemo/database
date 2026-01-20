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
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '500px' }}>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="metric-label">点踩轮次数（昨日）</div>
          <div className="metric-value">{data.count}</div>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="metric-label">点踩率（昨日）</div>
          <div className="metric-value">{data.rate}%</div>
          <div className="metric-sub">点踩轮次数 ÷ 总对话轮次数</div>
        </div>
      </div>

      {/* 趋势图 */}
      <h3 style={{ fontSize: '16px', marginTop: '24px', marginBottom: '12px', color: '#666' }}>
        点踩趋势
      </h3>
      <div className="chart-toggle">
        <button
          className={viewType === 'count' ? 'active' : ''}
          onClick={() => setViewType('count')}
        >
          轮次数
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
            <YAxis />
            <Tooltip />
            <Legend />
            {viewType === 'count' ? (
              <Line
                type="monotone"
                dataKey="count"
                name="点踩轮次数"
                stroke="#f5576c"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ) : (
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
