import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import CompanionHome from '../features/sathi/CompanionHome'
import TalkSathi from '../features/sathi/TalkSathi'
import HealthSimple from '../features/sathi/HealthSimple'
import SafetyPanel from '../features/sathi/SafetyPanel'
import FamilyBridge from '../features/sathi/FamilyBridge'
import MorePanel from '../features/sathi/MorePanel'
import ExplainPhoto from '../features/sathi/ExplainPhoto'
import MemoryPanel from '../features/sathi/MemoryPanel'
import FoodPanel from '../features/sathi/FoodPanel'
import TasksPanel from '../features/sathi/TasksPanel'
import DigitalHelp from '../features/sathi/DigitalHelp'
import EmergencyAssist from '../features/sathi/EmergencyAssist'
import SeniorSettings from '../features/sathi/SeniorSettings'
import { resolveEmergency } from '../lib/api'
import { useUiStore } from '../stores/useUiStore'
import { useCompanionStore } from '../stores/useCompanionStore'
import { useLifeRouteStore } from '../stores/useLifeRouteStore'
import { useProfileStore } from '../stores/useProfileStore'
import { PATHS, pathFor } from '../lib/paths'

const EmergencyTrack = lazy(() => import('../features/emergency/EmergencyTrack'))
const MedicalProfile = lazy(() => import('../features/profile/MedicalProfile'))
const TriageResults = lazy(() => import('../features/triage/components/TriageResults'))

function ToolsBack() {
  return (
    <Link className="sathi-btn-ghost" to={PATHS.more} style={{ marginBottom: 16, display: 'inline-flex' }}>
      <LayoutGrid size={15} /> All tools
    </Link>
  )
}

export function HomePage() {
  const { handleTalk, mic, listening, draft, setDraft } = useOutletContext()
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const tasks = useCompanionStore((s) => s.tasks)
  return (
    <CompanionHome
      profile={profile}
      tasks={tasks}
      wearable={profile.wearable}
      contacts={profile.emergencyContacts}
      onTalk={handleTalk}
      onMic={mic}
      listening={listening}
      onOpen={(tab, sub) => navigate(pathFor(tab, sub))}
      draft={draft}
      onDraft={setDraft}
    />
  )
}

export function TalkPage() {
  const { handleTalk, draft, setDraft, mic, listening, busy, error } = useOutletContext()
  const talk = useCompanionStore((s) => s.talk)
  return (
    <TalkSathi
      messages={talk}
      value={draft}
      onChange={setDraft}
      onSend={handleTalk}
      onMic={mic}
      listening={listening}
      busy={busy}
      error={error}
    />
  )
}

export function HealthPage() {
  const { handleTalk } = useOutletContext()
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const tasks = useCompanionStore((s) => s.tasks)
  return (
    <HealthSimple
      profile={profile}
      tasks={tasks}
      onEdit={() => navigate(PATHS.chart)}
      onTalk={handleTalk}
    />
  )
}

export function HealthChartPage() {
  return (
    <div>
      <Link className="sathi-btn-ghost" to={PATHS.health} style={{ marginBottom: 16, display: 'inline-flex' }}>
        <ArrowLeft size={15} /> Back to simple health
      </Link>
      <Suspense fallback={<p className="sathi-muted" role="status">Loading health chart…</p>}>
        <MedicalProfile />
      </Suspense>
    </div>
  )
}

export function SafetyPage() {
  const { startEmergency } = useOutletContext()
  const profile = useProfileStore((s) => s.profile)
  const events = useCompanionStore((s) => s.safetyEvents)
  return (
    <SafetyPanel
      profile={profile}
      events={events}
      onHelp={() => startEmergency({ source: 'senior', input: 'I need help' })}
    />
  )
}

export function FamilyPage() {
  const { startEmergency } = useOutletContext()
  const profile = useProfileStore((s) => s.profile)
  const messages = useCompanionStore((s) => s.messages)
  const addMessage = useCompanionStore((s) => s.addMessage)
  const patchContact = useProfileStore((s) => s.patchContact)
  const addContact = useProfileStore((s) => s.addContact)
  const removeContact = useProfileStore((s) => s.removeContact)
  return (
    <FamilyBridge
      profile={profile}
      messages={messages}
      onPatchContact={patchContact}
      onAddContact={addContact}
      onRemoveContact={removeContact}
      onMessage={addMessage}
      onFamilyEmergency={(person) => startEmergency({
        source: 'family',
        requestedBy: person.name,
        input: `Family assistance requested by ${person.name} (${person.relation || 'family'}) for ${profile.name || 'the senior'}`,
      })}
    />
  )
}

export function MorePage() {
  const navigate = useNavigate()
  return <MorePanel onOpen={(id) => navigate(pathFor('more', id))} />
}

export function ExplainPage() {
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const memories = useCompanionStore((s) => s.memories)
  const tasks = useCompanionStore((s) => s.tasks)
  const meals = useCompanionStore((s) => s.meals)
  const addMessage = useCompanionStore((s) => s.addMessage)
  return (
    <div>
      <ToolsBack />
      <ExplainPhoto
        profile={profile}
        companion={{ memories, tasks, meals }}
        onShare={(row) => {
          addMessage({ to: profile.emergencyContacts?.[0]?.name || 'Family', ...row })
          navigate(PATHS.family)
        }}
      />
    </div>
  )
}

export function MemoryPage() {
  const memories = useCompanionStore((s) => s.memories)
  const addMemory = useCompanionStore((s) => s.addMemory)
  const removeMemory = useCompanionStore((s) => s.removeMemory)
  return (
    <div>
      <ToolsBack />
      <MemoryPanel memories={memories} onAdd={addMemory} onRemove={removeMemory} />
    </div>
  )
}

export function FoodPage() {
  const profile = useProfileStore((s) => s.profile)
  const memories = useCompanionStore((s) => s.memories)
  const tasks = useCompanionStore((s) => s.tasks)
  const meals = useCompanionStore((s) => s.meals)
  const setMeals = useCompanionStore((s) => s.setMeals)
  return (
    <div>
      <ToolsBack />
      <FoodPanel profile={profile} companion={{ memories, tasks, meals }} meals={meals} onChange={setMeals} />
    </div>
  )
}

export function TasksPage() {
  const { handleTalk } = useOutletContext()
  const tasks = useCompanionStore((s) => s.tasks)
  const addTask = useCompanionStore((s) => s.addTask)
  const toggleTask = useCompanionStore((s) => s.toggleTask)
  const removeTask = useCompanionStore((s) => s.removeTask)
  return (
    <div>
      <ToolsBack />
      <TasksPanel
        tasks={tasks}
        onAdd={addTask}
        onToggle={toggleTask}
        onRemove={removeTask}
        onAskToday={() => handleTalk("What's important today?")}
      />
    </div>
  )
}

export function HelpPage() {
  const navigate = useNavigate()
  const profile = useProfileStore((s) => s.profile)
  const memories = useCompanionStore((s) => s.memories)
  const tasks = useCompanionStore((s) => s.tasks)
  const meals = useCompanionStore((s) => s.meals)
  return (
    <div>
      <ToolsBack />
      <DigitalHelp
        profile={profile}
        companion={{ memories, tasks, meals }}
        onExplain={() => navigate(PATHS.explain)}
      />
    </div>
  )
}

export function SettingsPage() {
  const profile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const textScale = useUiStore((s) => s.textScale)
  const setTextScale = useUiStore((s) => s.setTextScale)
  return (
    <div>
      <ToolsBack />
      <SeniorSettings
        profile={profile}
        onPatch={updateProfile}
        textScale={textScale}
        onTextScale={setTextScale}
      />
    </div>
  )
}

export function EmergencyPage() {
  const { closeEmergency, setShowDetails } = useOutletContext()
  const navigate = useNavigate()
  const [showOps, setShowOps] = useState(false)
  const result = useLifeRouteStore((s) => s.result)
  const sathiEmergency = useLifeRouteStore((s) => s.sathiEmergency)
  const profile = useProfileStore((s) => s.profile)

  const resolve = async () => {
    if (sathiEmergency?.id) {
      await resolveEmergency(sathiEmergency.id).catch(() => {})
    }
    closeEmergency()
  }

  if (showOps) {
    return (
      <Suspense fallback={<p className="sathi-muted" role="status">Loading hospital matching…</p>}>
        <EmergencyTrack
          result={result}
          onBack={() => setShowOps(false)}
          onOpenDetails={() => {
            setShowDetails(true)
            navigate(PATHS.referral)
          }}
          onNavigate={() => navigate(PATHS.settings)}
        />
      </Suspense>
    )
  }

  return (
    <EmergencyAssist
      emergency={sathiEmergency}
      profile={profile}
      result={result}
      onResolve={resolve}
      onDetails={() => setShowOps(true)}
      onBack={closeEmergency}
    />
  )
}

export function ReferralPage() {
  const { closeEmergency } = useOutletContext()
  const result = useLifeRouteStore((s) => s.result)
  const rawState = useLifeRouteStore((s) => s.rawState)
  return (
    <div>
      <Link className="sathi-btn-ghost" to={PATHS.emergency} style={{ marginBottom: 16, display: 'inline-flex' }}>
        <ArrowLeft size={15} /> Back to emergency help
      </Link>
      <Suspense fallback={<p className="sathi-muted" role="status">Loading referral…</p>}>
        <TriageResults result={result} rawState={rawState} onClose={closeEmergency} />
      </Suspense>
    </div>
  )
}
