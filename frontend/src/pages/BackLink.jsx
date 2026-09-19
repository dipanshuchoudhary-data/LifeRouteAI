import { Link } from 'react-router-dom'
import { PATHS } from '../lib/paths'

export default function BackLink({ to = PATHS.more, children = 'All tools' }) {
  return (
    <Link className="sathi-btn-ghost" to={to} style={{ marginBottom: 16, display: 'inline-flex' }}>
      {children}
    </Link>
  )
}
