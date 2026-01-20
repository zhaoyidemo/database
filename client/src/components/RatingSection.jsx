import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

function RatingSection({ distribution }) {
  const [trendData, setTrendData] = useState([])
  const [viewType, setViewType] = useState('count')

  useEffect(() => {
    fetchTrendData()
  }, [])

  const fetchTrendData = async () => {
    try {
      const response = await fetch('/api/ratings/trend?days=7')
      const data = await response.json()
      setTrendData(data)
    } catch (error) {
      console.error('获取评分趋势失败:', error)
    }
  }

  if (!distribution) return null

  const tableData = [
    { label: '5分', count: distribution.five.count, percentage: distribution.five.percentage, definition: '评分为5分的用户数（去重）' },
    { label: '4分', count: distribution.four.count, percentage: distribution.four.percentage, definition: '评分为4分的用户数（去重）' },
    { label: '低分（1-3分）', count: distribution.low.count, percentage: distribution.low.percentage, definition: '评分为1-3分的用户数（去重）' },
    { label: '未评分人数（已生成洞察）', count: distribution.unrated.count, percentage: '-', definition: '已生成洞察但未评分的用户数' }
  ]

  return (
    <>
      {/* 评分分布表格 */}
      <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
        评分分布（昨日）
      </h3>
      <table className="rating-table">
        <thead>
          <tr>
            <th>评分</th>
            <th>人数（去重）</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>{row.label}</td>
              <td>{row.count}</td>
              <td>{typeof row.percentage === 'number' ? `${row.percentage}%` : row.percentage}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 趋势图 */}
      <h3 style={{ fontSize: '16px', marginTop: '24px', marginBottom: '12px', color: '#666' }}>
        评分趋势
      </h3>
      <div className="chart-toggle">
        <button
          className={viewType === 'count' ? 'active' : ''}
          onClick={() => setViewType('count')}
        >
          人数
        </button>
        <button
          className={viewType === 'percentage' ? 'active' : ''}
          onClick={() => setViewType('percentage')}
        >
          占比
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="fiveStar" name="5分" fill="#10b981" />
            <Bar dataKey="fourStar" name="4分" fill="#3b82f6" />
            <Bar dataKey="lowStar" name="低分" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export default RatingSection
