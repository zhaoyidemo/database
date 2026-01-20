import InfoTooltip from './InfoTooltip'

function CoreMetrics({ coreMetrics, conversionRates }) {
  if (!coreMetrics) return null

  const { yesterday, total } = coreMetrics

  const metrics = [
    {
      label: '发起对话人数',
      yesterday: yesterday.conversations,
      total: total.conversations,
      color: '',
      definition: '至少发起1次对话的用户数（去重）'
    },
    {
      label: '生成洞察人数',
      yesterday: yesterday.insights,
      total: total.insights,
      color: 'blue',
      definition: '至少主动点击生成1次洞察的用户数（去重）'
    },
    {
      label: '对话轮数',
      yesterday: yesterday.dialogRounds,
      total: total.dialogRounds,
      color: 'green',
      definition: '一问一答 = 1轮'
    },
    {
      label: '评分人数',
      yesterday: yesterday.ratings,
      total: total.ratings,
      color: 'orange',
      definition: '至少完成1次评分的用户数（去重）'
    }
  ]

  return (
    <>
      {/* 核心指标卡片 */}
      <h3 className="subsection-title">1.1 核心指标</h3>
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`metric-card ${metric.color}`}>
            <div className="metric-label">
              {metric.label}
              <InfoTooltip text={metric.definition} />
            </div>
            <div className="metric-row">
              <span className="metric-tag">昨日</span>
              <span className="metric-value">{yesterday ? metric.yesterday.toLocaleString() : 0}</span>
            </div>
            <div className="metric-row">
              <span className="metric-tag-secondary">历史累计</span>
              <span className="metric-value-secondary">{total ? metric.total.toLocaleString() : 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 转化率指标 */}
      {conversionRates && (
        <>
          <h3 className="subsection-title">1.2 转化率指标</h3>
          <div className="conversion-grid">
            <div className="conversion-card">
              <div className="conversion-label">
                洞察触发率
                <InfoTooltip text="公式：昨日生成洞察用户数 ÷ 昨日发起对话人数" light />
              </div>
              <div className="conversion-row">
                <span className="conversion-tag">昨日</span>
                <span className="conversion-value">{conversionRates.insightTriggerRate}%</span>
              </div>
              <div className="conversion-calc">
                = {yesterday.insights} ÷ {yesterday.conversations} = {conversionRates.insightTriggerRate}%
              </div>
            </div>
            <div className="conversion-card">
              <div className="conversion-label">
                评分率
                <InfoTooltip text="公式：昨日评分用户数 ÷ 昨日生成洞察用户数" light />
              </div>
              <div className="conversion-row">
                <span className="conversion-tag">昨日</span>
                <span className="conversion-value">{conversionRates.ratingRate}%</span>
              </div>
              <div className="conversion-calc">
                = {yesterday.ratings} ÷ {yesterday.insights} = {conversionRates.ratingRate}%
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default CoreMetrics
