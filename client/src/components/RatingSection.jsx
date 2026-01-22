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
import TrendTimeSelector from './TrendTimeSelector'
import { API_ENDPOINTS } from '../config/api'

function RatingSection({ distribution }) {
  const [trendData, setTrendData] = useState([])
  const [viewType, setViewType] = useState('count')
  const [timeRange, setTimeRange] = useState('7')

  useEffect(() => {
    fetchTrendData(timeRange)
  }, [timeRange])

  const fetchTrendData = async (days) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ratingsTrend}?days=${days}`)
      const data = await response.json()
      // 计算占比百分比
      const dataWithPercentage = data.map(item => {
        const total = item.fiveStar + item.fourStar + item.lowStar
        return {
          ...item,
          fiveStarPct: total > 0 ? ((item.fiveStar / total) * 100).toFixed(1) : 0,
          fourStarPct: total > 0 ? ((item.fourStar / total) * 100).toFixed(1) : 0,
          lowStarPct: total > 0 ? ((item.lowStar / total) * 100).toFixed(1) : 0
        }
      })
      setTrendData(dataWithPercentage)
    } catch (error) {
      console.error('获取评分趋势失败:', error)
    }
  }

  const handleCustomDateChange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    fetchTrendData(days)
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
      <h3 className="subsection-title">2.1 评分分布（昨日）</h3>
      <div className="table-wrapper">
      <table className="rating-table">
        <thead>
          <tr>
            <th>评分</th>
            <th>
              人数（去重）
              <span className="info-tooltip info-tooltip-light">
                <span className="info-icon">!</span>
                <span className="tooltip-text">占比 = 该分数人数 ÷ 昨日评分的总人数</span>
              </span>
            </th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>
                {row.label}
                <span className="info-tooltip info-tooltip-light">
                  <span className="info-icon">!</span>
                  <span className="tooltip-text">{row.definition}</span>
                </span>
              </td>
              <td>{row.count}</td>
              <td>{typeof row.percentage === 'number' ? `${row.percentage}%` : row.percentage}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* 趋势图 */}
      <h3 className="subsection-title" style={{ marginTop: '24px' }}>2.2 趋势图</h3>
      <TrendTimeSelector
        value={timeRange}
        onChange={setTimeRange}
        onCustomDateChange={handleCustomDateChange}
      />
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
            <YAxis unit={viewType === 'percentage' ? '%' : ''} />
            <Tooltip
              formatter={(value, name) => [
                viewType === 'percentage' ? `${value}%` : value,
                name
              ]}
            />
            <Legend />
            {viewType === 'count' ? (
              <>
                <Bar dataKey="fiveStar" name="5分" fill="#10b981" />
                <Bar dataKey="fourStar" name="4分" fill="#3b82f6" />
                <Bar dataKey="lowStar" name="低分" fill="#ef4444" />
              </>
            ) : (
              <>
                <Bar dataKey="fiveStarPct" name="5分占比" fill="#10b981" />
                <Bar dataKey="fourStarPct" name="4分占比" fill="#3b82f6" />
                <Bar dataKey="lowStarPct" name="低分占比" fill="#ef4444" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export default RatingSection
