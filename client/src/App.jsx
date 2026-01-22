import { useState, useEffect } from 'react'
import CoreMetrics from './components/CoreMetrics'
import RatingSection from './components/RatingSection'
import ThumbsDownSection from './components/ThumbsDownSection'
import ABComparison from './components/ABComparison'
import TrendChart from './components/TrendChart'
import { API_ENDPOINTS } from './config/api'

function App() {
  const [data, setData] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [timeRange, setTimeRange] = useState('7')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // 获取昨日日期
  const getYesterdayDate = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (timeRange !== 'custom') {
      fetchTrendData(timeRange)
    }
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.dashboard)
      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (error) {
      console.error('获取数据失败:', error)
      setLoading(false)
    }
  }

  const fetchTrendData = async (days) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.trends}?days=${days}`)
      const result = await response.json()
      setTrendData(result)
    } catch (error) {
      console.error('获取趋势数据失败:', error)
    }
  }

  const handleCustomDateChange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    fetchTrendData(days)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchDashboardData()
    fetchTrendData(timeRange)
  }

  if (loading) {
    return (
      <div className="loading">
        <span>加载中...</span>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-main">
          <h1>齐家AI 数据看板</h1>
          <p className="header-subtitle">
            数据每日更新 | 基于自然日 0:00-24:00 | 昨日数据：<strong>{getYesterdayDate()}</strong>
          </p>
        </div>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="refresh-btn" onClick={handleRefresh} title="刷新数据">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </header>

      {/* 一、基础数据 */}
      <section className="section">
        <h2 className="section-title">一、基础数据</h2>
        <CoreMetrics
          coreMetrics={data?.coreMetrics}
          conversionRates={data?.conversionRates}
          yesterdayDate={getYesterdayDate()}
        />
        <TrendChart data={trendData} timeRange={timeRange} onTimeRangeChange={setTimeRange} onCustomDateChange={handleCustomDateChange} />
      </section>

      {/* 二、用户评分 */}
      <section className="section">
        <h2 className="section-title">二、用户评分</h2>
        <RatingSection distribution={data?.ratingDistribution} yesterdayDate={getYesterdayDate()} />
      </section>

      {/* 三、点踩数据 */}
      <section className="section">
        <h2 className="section-title">三、点踩数据</h2>
        <ThumbsDownSection data={data?.thumbsDown} yesterdayDate={getYesterdayDate()} />
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
