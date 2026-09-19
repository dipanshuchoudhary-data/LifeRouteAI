import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import SathiLayout from './pages/SathiLayout'
import {
  EmergencyPage,
  ExplainPage,
  FamilyPage,
  FoodPage,
  HealthChartPage,
  HealthPage,
  HelpPage,
  HomePage,
  MemoryPage,
  MorePage,
  ReferralPage,
  SafetyPage,
  SettingsPage,
  TalkPage,
  TasksPage,
} from './pages/sathiRoutes'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<SathiLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/talk" element={<TalkPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/health/chart" element={<HealthChartPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/family" element={<FamilyPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/explain" element={<ExplainPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/emergency/referral" element={<ReferralPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
