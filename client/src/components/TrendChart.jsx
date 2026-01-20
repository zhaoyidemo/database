import { useState } from 'react'
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

function TrendChart({ data }) {
  const [chartType, setChartType] = useState('users')

  if (!data || data.length === 0) return null

  const chartConfigs = {
    users: {
      lines: [
        { key: 'conversations', name: '发起对话人数', color: '#8884d8' },
        { key: 'insights', name: '生成洞察人数', color: '#82ca9d' },
        { key: 'ratings', name: '评分人数', color: '#ffc658' }
      ],
      yAxisLabel: '人数'
    },
    rounds: {
      lines: [
        { key: 'dialogRounds', name: '对话轮数', color: '#ff7300' }
      ],
      yAxisLabel: '轮数'
    },
    conversion: {
      lines: [
        { key: 'insightTriggerRate', name: '洞察触发率', color: '#4f46e5' },
        { key: 'ratingRate', name: '评分率', color: '#10b981' }
      ],
      yAxisLabel: '百分比(%)'
    }
  }

  const config = chartConfigs[chartType]

  return (
    <div>
      <h3 className="subsection-title">1.3 趋势图</h3>
      <div className="chart-toggle">
        <button
          className={chartType === 'users' ? 'active' : ''}
          onClick={() => setChartType('users')}
        >
          人数
        </button>
        <button
          className={chartType === 'rounds' ? 'active' : ''}
          onClick={() => setChartType('rounds')}
        >
          轮数
        </button>
        <button
          className={chartType === 'conversion' ? 'active' : ''}
          onClick={() => setChartType('conversion')}
        >
          转化率
        </button>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              unit={chartType === 'conversion' ? '%' : ''}
              domain={chartType === 'conversion' ? [0, 100] : ['auto', 'auto']}
            />
            <Tooltip
              formatter={(value, name) => [
                chartType === 'conversion' ? `${value}%` : value,
                name
              ]}
            />
            <Legend />
            {config.lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendChart
