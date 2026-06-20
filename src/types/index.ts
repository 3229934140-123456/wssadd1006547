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
  createdAt: string;
}

export type ObservationType = 'pain' | 'swelling' | 'occlusion' | 'bleeding';

export interface ObservationItem {
  type: ObservationType;
  name: string;
  value?: number;
  description?: string;
}

export type FollowupStatus = 'pending' | 'completed' | 'abnormal';

export type DoctorAction = 'call' | 'nurse' | 'revisit';

export interface TimelineRecord {
  id: string;
  date: string;
  type: 'surgery' | 'followup' | 'note';
  title: string;
  description: string;
  isAbnormal: boolean;
  action?: DoctorAction;
  photos?: string[];
  observations?: ObservationItem[];
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
}

export interface TodoItem {
  id: string;
  patientId: string;
  patientName: string;
  type: 'abnormal' | 'pending' | 'urgent';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledDate: string;
  isRead: boolean;
}

export type TabBarPage = 'patient' | 'todo' | 'mine';
