export interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  userId?: string;
  role?: string;
}

const ERROR_LOG_KEY = "amauta_error_logs";
const MAX_LOGS = 100;

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function _getErrorLogs(): ErrorLogEntry[] {
  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveErrorLogs(logs: ErrorLogEntry[]): void {
  try {
    const trimmed = logs.slice(-MAX_LOGS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    console.warn("[ErrorLogger] Failed to save to localStorage");
  }
}

export function logError(
  error: Error,
  context?: {
    componentStack?: string;
    userId?: string;
    role?: string;
  }
): string {
  const id = generateErrorId();
  const entry: ErrorLogEntry = {
    id,
    message: error.message,
    stack: error.stack,
    componentStack: context?.componentStack,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: context?.userId,
    role: context?.role,
  };

  const logs = _getErrorLogs();
  logs.push(entry);
  saveErrorLogs(logs);

  console.error(`[ErrorLogger] ${id}:`, error);

  return id;
}

export function getErrorLogs(): ErrorLogEntry[] {
  return _getErrorLogs();
}

export function clearErrorLogs(): void {
  localStorage.removeItem(ERROR_LOG_KEY);
}

export function getErrorLogsGrouped(): Record<string, number> {
  const logs = _getErrorLogs();
  const grouped: Record<string, number> = {};
  
  for (const log of logs) {
    const key = log.message.slice(0, 50);
    grouped[key] = (grouped[key] || 0) + 1;
  }
  
  return grouped;
}