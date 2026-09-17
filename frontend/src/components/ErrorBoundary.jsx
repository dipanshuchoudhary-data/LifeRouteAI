import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#8E8D89', marginBottom: 20 }}>The navigation UI hit an unexpected error. Reload to continue. If this is a medical emergency, call 108 now.</p>
            <a href="tel:108" style={{ display: 'inline-flex', background: '#E53935', color: '#fff', padding: '12px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>Call 108</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
