function InfoTooltip({ text, light = false }) {
  return (
    <span className={`info-tooltip ${light ? 'info-tooltip-light' : ''}`}>
      <span className="info-icon">!</span>
      <span className="tooltip-text">{text}</span>
    </span>
  )
}

export default InfoTooltip
