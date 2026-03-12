/**
 * Parses raw WebView postMessage strings from the navigation agent and
 * dispatches them to typed callbacks.
 */

export type AgentMessageType =
  | 'agent_loaded'
  | 'navigation'
  | 'action'
  | 'quiz_detected'
  | 'course_complete'
  | 'status'
  | 'cookies'; // also comes from cookie-capture script

export interface AgentMessage {
  type: AgentMessageType;
  domain?: string;
  url?: string;
  action?: string;
  text?: string;
  scrollDepth?: number;
  cookies?: string;
  value?: string;
}

export interface AgentCallbacks {
  onAgentLoaded?: (domain: string) => void;
  onNavigation?: (url: string) => void;
  onAction?: (action: string, text: string) => void;
  onQuizDetected?: (url: string) => void;
  onCourseComplete?: (url: string) => void;
  onStatusUpdate?: (text: string, scrollDepth?: number) => void;
  onCookies?: (url: string, cookies: string) => void;
}

export function handleAgentMessage(
  rawData: string,
  callbacks: AgentCallbacks
): void {
  let msg: AgentMessage;
  try {
    msg = JSON.parse(rawData) as AgentMessage;
  } catch {
    return; // not a JSON message from our agent
  }

  switch (msg.type) {
    case 'agent_loaded':
      callbacks.onAgentLoaded?.(msg.domain ?? '');
      break;

    case 'navigation':
      callbacks.onNavigation?.(msg.url ?? '');
      break;

    case 'action':
      callbacks.onAction?.(msg.action ?? '', msg.text ?? '');
      break;

    case 'quiz_detected':
      callbacks.onQuizDetected?.(msg.url ?? '');
      break;

    case 'course_complete':
      callbacks.onCourseComplete?.(msg.url ?? '');
      break;

    case 'status':
      callbacks.onStatusUpdate?.(msg.text ?? '', msg.scrollDepth);
      break;

    case 'cookies':
      callbacks.onCookies?.(msg.url ?? '', msg.cookies ?? msg.value ?? '');
      break;

    default:
      // Unknown message type — silently ignore
      break;
  }
}

// ─── Log Entry ────────────────────────────────────────────────────────────────

export type LogEntryKind = 'action' | 'quiz' | 'status' | 'loaded';

export interface AgentLogEntry {
  id: number;
  kind: LogEntryKind;
  text: string;
  timestamp: number;
}

let _logCounter = 0;

export function makeLogEntry(kind: LogEntryKind, text: string): AgentLogEntry {
  return { id: ++_logCounter, kind, text, timestamp: Date.now() };
}
