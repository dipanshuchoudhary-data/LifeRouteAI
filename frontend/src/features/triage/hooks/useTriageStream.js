import { useLifeRouteStore } from '../../../stores/useLifeRouteStore'

export function useTriageStream() {
  const status = useLifeRouteStore((s) => s.status)
  const activeNode = useLifeRouteStore((s) => s.activeNode)
  const submitMessage = useLifeRouteStore((s) => s.submitMessage)
  const error = useLifeRouteStore((s) => s.error)
  return { status, activeNode, submitMessage, error, isStreaming: status === 'streaming' }
}
