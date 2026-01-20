import { useState } from 'react'

function TimeSelector({ value, onChange, onCustomDateChange }) {
  const [showCustom, setShowCustom] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const options = [
    { label: '昨日', value: '1' },
    { label: '过去7天', value: '7' },
    { label: '过去30天', value: '30' }
  ]

  const handleCustomClick = () => {
    setShowCustom(!showCustom)
    if (!showCustom) {
      onChange('custom')
    }
  }

  const handleDateApply = () => {
    if (startDate && endDate && onCustomDateChange) {
      onCustomDateChange(startDate, endDate)
    }
  }

  return (
    <div className="time-selector-wrapper">
      <div className="time-selector">
        {options.map((option) => (
          <button
            key={option.value}
            className={value === option.value ? 'active' : ''}
            onClick={() => {
              setShowCustom(false)
              onChange(option.value)
            }}
          >
            {option.label}
          </button>
        ))}
        <button
          className={value === 'custom' ? 'active' : ''}
          onClick={handleCustomClick}
        >
          自定义日期
        </button>
      </div>
      {showCustom && (
        <div className="custom-date-picker">
          <div className="date-inputs">
            <label>
              开始日期
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <span className="date-separator">至</span>
            <label>
              结束日期
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <button className="apply-btn" onClick={handleDateApply}>
              应用
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeSelector
