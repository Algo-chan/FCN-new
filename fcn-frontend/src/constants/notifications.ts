export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'appointment_booked',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_STARTED: 'appointment_started',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  RESCHEDULE_REQUESTED: 'reschedule_requested',
  NEW_MESSAGE: 'new_message',
  PRESCRIPTION_ISSUED: 'prescription_issued',
  VITAL_ALERT: 'vital_alert',
  AI_ASSESSMENT_COMPLETE: 'ai_assessment_complete',
  REFILL_DUE: 'refill_due',
  REFILL_REQUESTED: 'refill_requested',
  REFILL_APPROVED: 'refill_approved',
  REFILL_DECLINED: 'refill_declined',
  PRESCRIPTION_DISPENSED: 'prescription_dispensed',
  MEDICATION_REMINDER: 'medication_reminder',
  LAB_RESULTS_READY: 'lab_results_ready',
  ACCOUNT_APPROVED: 'account_approved',
  ACCOUNT_REJECTED: 'account_rejected',
  DOCTOR_PENDING_APPROVAL: 'doctor_pending_approval',
  WELCOME: 'welcome',
  RATE_CONSULTATION: 'rate_consultation',
} as const;

export const NOTIFICATION_GROUPS: Record<string, readonly string[]> = {
  appointments: [
    'appointment_booked',
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_reminder',
    'appointment_started',
    'appointment_completed',
    'reschedule_requested',
  ],
  messages: [
    'new_message',
    'prescription_issued',
  ],
  health: [
    'vital_alert',
    'ai_assessment_complete',
    'lab_results_ready',
    'medication_reminder',
  ],
  pharmacy: [
    'refill_due',
    'refill_requested',
    'refill_approved',
    'refill_declined',
    'prescription_dispensed',
  ],
  account: [
    'account_approved',
    'account_rejected',
    'doctor_pending_approval',
    'welcome',
    'rate_consultation',
  ],
} as const;

export const NOTIFICATION_META: Record<string, { icon: string; color: string }> = {
  appointment_booked: { icon: 'CalendarPlus', color: '#0A7EA4' },
  appointment_confirmed: { icon: 'CalendarCheck', color: '#10B981' },
  appointment_cancelled: { icon: 'CalendarX', color: '#F87171' },
  appointment_reminder: { icon: 'Bell', color: '#FBBF24' },
  appointment_started: { icon: 'Video', color: '#10B981' },
  appointment_completed: { icon: 'CheckCircle', color: '#10B981' },
  reschedule_requested: { icon: 'CalendarClock', color: '#FBBF24' },
  new_message: { icon: 'MessageCircle', color: '#0A7EA4' },
  prescription_issued: { icon: 'Pill', color: '#2DD4BF' },
  vital_alert: { icon: 'AlertTriangle', color: '#F87171' },
  ai_assessment_complete: { icon: 'Sparkles', color: '#2DD4BF' },
  lab_results_ready: { icon: 'TestTube', color: '#10B981' },
  refill_due: { icon: 'AlertCircle', color: '#FBBF24' },
  refill_requested: { icon: 'RefreshCw', color: '#0A7EA4' },
  refill_approved: { icon: 'CheckCircle', color: '#10B981' },
  refill_declined: { icon: 'XCircle', color: '#F87171' },
  prescription_dispensed: { icon: 'ShoppingBag', color: '#10B981' },
  medication_reminder: { icon: 'Clock', color: '#FBBF24' },
  account_approved: { icon: 'UserCheck', color: '#10B981' },
  account_rejected: { icon: 'UserX', color: '#F87171' },
  doctor_pending_approval: { icon: 'UserPlus', color: '#FBBF24' },
  welcome: { icon: 'Heart', color: '#0A7EA4' },
  rate_consultation: { icon: 'Star', color: '#FBBF24' },
};

export function getGroupForType(type: string): string {
  for (const [group, types] of Object.entries(NOTIFICATION_GROUPS)) {
    if (types.includes(type)) return group;
  }
  return 'appointments';
}

export const GROUP_LABELS: Record<string, string> = {
  all: 'All',
  appointments: '\u{1F4C5} Appointments',
  messages: '\u{1F4AC} Messages',
  health: '\u{1F3E5} Health',
  pharmacy: '\u{1F48A} Pharmacy',
  account: '\u{1F464} Account',
};

export const GROUP_EMPTY_MESSAGES: Record<string, string> = {
  all: "You're all caught up!",
  appointments: 'No appointment notifications',
  messages: 'No new messages',
  health: 'No health alerts',
  pharmacy: 'No pharmacy updates',
  account: 'No account updates',
};
