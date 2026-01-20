import { useState, useEffect } from 'react'
import CoreMetrics from './components/CoreMetrics'
import RatingSection from './components/RatingSection'
import ThumbsDownSection from './components/ThumbsDownSection'
import ABComparison from './components/ABComparison'
import TimeSelector from './components/TimeSelector'
import TrendChart from './components/TrendChart'

function App() {
  const [data, setData] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [timeRange, setTimeRange] = useState('7')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    fetchTrendData(timeRange)
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()
      setData(result)
      setLoading(false)
    } catch (error) {
      console.error('获取数据失败:', error)
      setLoading(false)
    }
  }

  const fetchTrendData = async (days) => {
    try {
      const response = await fetch(`/api/trends?days=${days}`)
      const result = await response.json()
      setTrendData(result)
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>齐家AI 数据看板</h1>
        <p>数据每日更新 | 基于自然日 0:00-24:00</p>
      </header>

      {/* 一、基础数据 */}
      <section className="section">
        <h2 className="section-title">一、基础数据</h2>
        <CoreMetrics
          coreMetrics={data?.coreMetrics}
          conversionRates={data?.conversionRates}
        />
        <TimeSelector value={timeRange} onChange={setTimeRange} />
        <TrendChart data={trendData} />
      </section>

      {/* 二、用户评分 */}
      <section className="section">
        <h2 className="section-title">二、用户评分</h2>
        <RatingSection distribution={data?.ratingDistribution} />
      </section>

      {/* 三、点踩数据 */}
      <section className="section">
        <h2 className="section-title">三、点踩数据</h2>
        <ThumbsDownSection data={data?.thumbsDown} />
      </section>

      {/* 四、AB版本对比 */}
      <section className="section">
        <h2 className="section-title">四、AB版本对比</h2>
        <ABComparison data={data?.abComparison} />
      </section>
    </div>
  )
}

export default App
