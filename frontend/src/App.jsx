import ErrorBoundary from './components/ErrorBoundary'
import LifeRoutePage from './pages/LifeRoutePage'

export default function App() {
  return (
    <ErrorBoundary>
      <LifeRoutePage />
    </ErrorBoundary>
  )
}
