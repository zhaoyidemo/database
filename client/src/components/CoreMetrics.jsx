function CoreMetrics({ coreMetrics, conversionRates }) {
  if (!coreMetrics) return null

  const { yesterday, total } = coreMetrics

  const metrics = [
    {
      label: '发起对话人数',
      yesterday: yesterday.conversations,
      total: total.conversations,
      color: ''
    },
    {
      label: '生成洞察人数',
      yesterday: yesterday.insights,
      total: total.insights,
      color: 'blue'
    },
    {
      label: '对话轮数',
      yesterday: yesterday.dialogRounds,
      total: total.dialogRounds,
      color: 'green'
    },
    {
      label: '评分人数',
      yesterday: yesterday.ratings,
      total: total.ratings,
      color: 'orange'
    }
  ]

  return (
    <>
      {/* 核心指标卡片 */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`metric-card ${metric.color}`}>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.yesterday.toLocaleString()}</div>
            <div className="metric-sub">历史累计: {metric.total.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* 转化率指标 */}
      {conversionRates && (
        <div className="conversion-grid">
          <div className="conversion-card">
            <div className="conversion-label">洞察触发率</div>
            <div className="conversion-value">{conversionRates.insightTriggerRate}%</div>
            <div className="conversion-formula">
              昨日生成洞察用户数 ÷ 昨日发起对话人数
            </div>
          </div>
          <div className="conversion-card">
            <div className="conversion-label">评分率</div>
            <div className="conversion-value">{conversionRates.ratingRate}%</div>
            <div className="conversion-formula">
              昨日评分用户数 ÷ 昨日生成洞察用户数
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CoreMetrics
