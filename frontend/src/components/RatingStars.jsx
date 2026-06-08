export default function RatingStars({ rating, reviewCount, size = 'md' }) {
  const full = Math.floor(rating || 0)
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center gap-1.5 ${sizeClass}`}>
      <div className="flex" style={{ color: '#F97316' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ opacity: i <= full ? 1 : 0.25 }}>★</span>
        ))}
      </div>
      <span className="font-semibold text-text-primary">{(rating || 0).toFixed(1)}</span>
      {reviewCount != null && (
        <span style={{ color: 'var(--text-muted)' }}>
          ({reviewCount?.toLocaleString()} reviews)
        </span>
      )}
    </div>
  )
}
