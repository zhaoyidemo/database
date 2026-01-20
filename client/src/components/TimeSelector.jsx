function TimeSelector({ value, onChange }) {
  const options = [
    { label: '昨日', value: '1' },
    { label: '过去7天', value: '7' },
    { label: '过去30天', value: '30' }
  ]

  return (
    <div className="time-selector">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TimeSelector
