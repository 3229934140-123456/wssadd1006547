export interface HighScoreDetail {
  type: ObservationType;
  name: string;
  value: number;
  threshold: number;
}

export interface Patient {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  surgeryDate: string;
  implantCount: number;
  implantPosition: string;
  hasBoneGraft: boolean;
  isImmediateLoading: boolean;
  notes?: string;
  status: 'normal' | 'abnormal' | 'recovered';
  followupCount: number;
  nextFollowupDate?: string;
  revisitReminder?: {
    id: string;
    scheduledDate: string;
    completed: boolean;
    reason: string;
    result?: string;
    rescheduledCount?: number;
  };
  createdAt: string;
}

export type ObservationType = 'pain' | 'swelling' | 'occlusion' | 'bleeding';

export interface ObservationItem {
  type: ObservationType;
  name: string;
  value?: number;
  description?: string;
  threshold?: number;
}

export type FollowupStatus = 'pending' | 'completed' | 'abnormal';

export type DoctorAction = 'call' | 'nurse' | 'revisit';

export interface TimelineRecord {
  id: string;
  date: string;
  type: 'surgery' | 'followup' | 'pendingFollowup' | 'note' | 'revisit';
  title: string;
  description: string;
  isAbnormal: boolean;
  action?: DoctorAction;
  photos?: string[];
  observations?: ObservationItem[];
  followupId?: string;
  doctorNotes?: string;
  patientSymptoms?: string;
  highScoreObservations?: ObservationItem[];
}

export interface FollowupTask {
  id: string;
  patientId: string;
  patientName: string;
  scheduledDate: string;
  status: FollowupStatus;
  observations: ObservationItem[];
  patientPhotos?: string[];
  patientSymptoms?: string;
  doctorAction?: DoctorAction;
  doctorNotes?: string;
  isAbnormal: boolean;
  createdAt: string;
  completedAt?: string;
  templateName?: string;
}

export interface TodoItem {
  id: string;
  patientId: string;
  patientName: string;
  type: 'abnormal' | 'pending' | 'urgent' | 'highScore' | 'revisit';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledDate: string;
  isRead: boolean;
  highScoreTypes?: ObservationType[];
  highScoreDetails?: HighScoreDetail[];
  followupId?: string;
}

export interface FollowupPlanTemplate {
  name: string;
  description: string;
  plans: {
    daysAfterSurgery: number;
    name: string;
    observations: { type: ObservationType; name: string; threshold: number }[];
  }[];
}

export type TabBarPage = 'patient' | 'todo' | 'mine';
