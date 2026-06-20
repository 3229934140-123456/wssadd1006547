import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { Patient, FollowupTask, TodoItem, TimelineRecord, DoctorAction } from '@/types';
import { mockPatients } from '@/data/mockPatients';
import { mockFollowupTasks, mockTodoItems, mockTimelines } from '@/data/mockFollowups';
import { isToday } from '@/utils/date';

const STORAGE_KEYS = {
  patients: 'dental_app_patients',
  followupTasks: 'dental_app_followup_tasks',
  todoItems: 'dental_app_todo_items',
  timelines: 'dental_app_timelines',
  initialized: 'dental_app_initialized'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = Taro.getStorageSync(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error('[Storage] Failed to load:', key, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] Failed to save:', key, e);
  }
}

interface AppContextType {
  patients: Patient[];
  followupTasks: FollowupTask[];
  todoItems: TodoItem[];
  timelines: Record<string, TimelineRecord[]>;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => string;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addFollowupTask: (task: Omit<FollowupTask, 'id' | 'createdAt'>) => string;
  updateFollowupTask: (id: string, updates: Partial<FollowupTask>) => void;
  completeFollowup: (followupId: string, patientId: string, action: DoctorAction, notes: string) => void;
  markTodoRead: (id: string) => void;
  removeTodoItem: (id: string) => void;
  getUnreadTodoCount: () => number;
  getTimelineByPatientId: (patientId: string) => TimelineRecord[];
  getFollowupsByPatientId: (patientId: string) => FollowupTask[];
  getTodayFollowupTasks: () => FollowupTask[];
  getPatientById: (id: string) => Patient | undefined;
  getFollowupById: (id: string) => FollowupTask | undefined;
  getTodoByFollowupId: (followupId: string) => TodoItem | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const actionTextMap: Record<DoctorAction, string> = {
  call: '医生电话回访',
  nurse: '护士代办',
  revisit: '建议复诊'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => loadFromStorage(STORAGE_KEYS.patients, mockPatients));
  const [followupTasks, setFollowupTasks] = useState<FollowupTask[]>(() => loadFromStorage(STORAGE_KEYS.followupTasks, mockFollowupTasks));
  const [todoItems, setTodoItems] = useState<TodoItem[]>(() => loadFromStorage(STORAGE_KEYS.todoItems, mockTodoItems));
  const [timelines, setTimelines] = useState<Record<string, TimelineRecord[]>>(() => loadFromStorage(STORAGE_KEYS.timelines, mockTimelines));

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.patients, patients);
  }, [patients]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.followupTasks, followupTasks);
  }, [followupTasks]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.todoItems, todoItems);
  }, [todoItems]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.timelines, timelines);
  }, [timelines]);

  const getPatientById = useCallback((id: string): Patient | undefined => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const getFollowupById = useCallback((id: string): FollowupTask | undefined => {
    return followupTasks.find(f => f.id === id);
  }, [followupTasks]);

  const getFollowupsByPatientId = useCallback((patientId: string): FollowupTask[] => {
    return followupTasks.filter(f => f.patientId === patientId);
  }, [followupTasks]);

  const getTimelineByPatientId = useCallback((patientId: string): TimelineRecord[] => {
    return timelines[patientId] || [];
  }, [timelines]);

  const getTodayFollowupTasks = useCallback((): FollowupTask[] => {
    return followupTasks.filter(f => f.status === 'pending' && isToday(f.scheduledDate));
  }, [followupTasks]);

  const getTodoByFollowupId = useCallback((followupId: string): TodoItem | undefined => {
    const followup = followupTasks.find(f => f.id === followupId);
    if (!followup) return undefined;
    return todoItems.find(t => t.patientId === followup.patientId && t.scheduledDate === followup.scheduledDate);
  }, [followupTasks, todoItems]);

  const addTimelineRecord = useCallback((patientId: string, record: TimelineRecord) => {
    setTimelines(prev => {
      const existing = prev[patientId] || [];
      return {
        ...prev,
        [patientId]: [record, ...existing]
      };
    });
  }, []);

  const generateTodoFromFollowup = useCallback((task: FollowupTask) => {
    const existingTodo = todoItems.find(t =>
      t.patientId === task.patientId && t.scheduledDate === task.scheduledDate
    );
    if (existingTodo) return;

    const hasHighScore = task.observations.some(o => (o.value || 0) >= 5);
    const newTodo: TodoItem = {
      id: `todo_f_${task.id}`,
      patientId: task.patientId,
      patientName: task.patientName,
      type: task.isAbnormal ? 'abnormal' : 'pending',
      title: task.isAbnormal
        ? `${task.observations.filter(o => (o.value || 0) >= 5).map(o => o.name).join('、')}异常`
        : '常规回访',
      description: task.patientSymptoms
        || task.observations.map(o => `${o.name}${o.value ? o.value + '分' : '待评'}`).join('，'),
      priority: hasHighScore ? 'high' : task.isAbnormal ? 'medium' : 'low',
      scheduledDate: task.scheduledDate,
      isRead: false
    };
    setTodoItems(prev => [newTodo, ...prev]);
  }, [todoItems]);

  const addPatient = useCallback((patient: Omit<Patient, 'id' | 'createdAt'>): string => {
    const newId = String(Date.now());
    const newPatient: Patient = {
      ...patient,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [newPatient, ...prev]);

    const surgeryRecord: TimelineRecord = {
      id: `t_${newId}_surgery`,
      date: newPatient.surgeryDate,
      type: 'surgery',
      title: '种植手术完成',
      description: `${newPatient.implantPosition}种植${newPatient.implantCount}颗${newPatient.hasBoneGraft ? '，植骨' : ''}${newPatient.isImmediateLoading ? '，即刻负重' : ''}`,
      isAbnormal: false
    };
    addTimelineRecord(newId, surgeryRecord);

    console.log('[AppContext] Added new patient:', newPatient.name);
    return newId;
  }, [addTimelineRecord]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
    console.log('[AppContext] Updated patient:', id);
  }, []);

  const addFollowupTask = useCallback((task: Omit<FollowupTask, 'id' | 'createdAt'>): string => {
    const newId = `f_${Date.now()}`;
    const newTask: FollowupTask = {
      ...task,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setFollowupTasks(prev => [newTask, ...prev]);
    generateTodoFromFollowup(newTask);

    const pendingRecord: TimelineRecord = {
      id: `t_${task.patientId}_pending_${newId}`,
      date: newTask.scheduledDate,
      type: 'pendingFollowup',
      title: task.observations.length > 0
        ? `回访计划：${task.observations.map(o => o.name).join('、')}`
        : '回访计划',
      description: task.observations.length > 0
        ? `观察项：${task.observations.map(o => o.name).join('、')}`
        : '医生已创建回访任务，请按计划跟进',
      isAbnormal: newTask.isAbnormal,
      followupId: newId
    };
    addTimelineRecord(task.patientId, pendingRecord);

    console.log('[AppContext] Added new followup task for:', task.patientName, 'date:', task.scheduledDate);
    return newId;
  }, [generateTodoFromFollowup, addTimelineRecord]);

  const updateFollowupTask = useCallback((id: string, updates: Partial<FollowupTask>) => {
    setFollowupTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
    console.log('[AppContext] Updated followup task:', id);
  }, []);

  const completeFollowup = useCallback((followupId: string, patientId: string, action: DoctorAction, notes: string) => {
    const today = new Date().toISOString().split('T')[0];

    setFollowupTasks(prev => prev.map(t =>
      t.id === followupId ? {
        ...t,
        status: 'completed' as const,
        doctorAction: action,
        doctorNotes: notes,
        completedAt: today
      } : t
    ));

    const followup = followupTasks.find(f => f.id === followupId);
    if (followup) {
      const hasAbnormal = followup.observations.some(o => (o.value || 0) >= 5);
      const record: TimelineRecord = {
        id: `t_${patientId}_f_${Date.now()}`,
        date: today,
        type: 'followup',
        title: `回访完成 - ${actionTextMap[action]}`,
        description: notes || `${actionTextMap[action]}${hasAbnormal ? '，发现异常指标' : '，患者恢复良好'}`,
        isAbnormal: hasAbnormal,
        action,
        observations: followup.observations.filter(o => o.value !== undefined)
      };
      setTimelines(prev => {
        const existing = prev[patientId] || [];
        const filtered = existing.filter(r => r.followupId !== followupId);
        return {
          ...prev,
          [patientId]: [record, ...filtered]
        };
      });
    }

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const hasAbnormal = followup?.observations.some(o => (o.value || 0) >= 5) || false;
      const pendingFollowups = followupTasks.filter(
        f => f.patientId === patientId && f.status === 'pending' && f.id !== followupId
      );
      return {
        ...p,
        status: hasAbnormal ? 'abnormal' as const : 'normal' as const,
        followupCount: p.followupCount + 1,
        nextFollowupDate: pendingFollowups.length > 0
          ? pendingFollowups.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0].scheduledDate
          : undefined
      };
    }));

    setTodoItems(prev => prev.filter(t => {
      if (t.patientId === patientId && t.scheduledDate === followup?.scheduledDate) {
        return false;
      }
      return true;
    }));

    console.log('[AppContext] Completed followup:', followupId, 'action:', action);
  }, [followupTasks, addTimelineRecord]);

  const markTodoRead = useCallback((id: string) => {
    setTodoItems(prev => prev.map(t =>
      t.id === id ? { ...t, isRead: true } : t
    ));
  }, []);

  const removeTodoItem = useCallback((id: string) => {
    setTodoItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const getUnreadTodoCount = useCallback(() => {
    return todoItems.filter(t => !t.isRead).length;
  }, [todoItems]);

  return (
    <AppContext.Provider value={{
      patients,
      followupTasks,
      todoItems,
      timelines,
      addPatient,
      updatePatient,
      addFollowupTask,
      updateFollowupTask,
      completeFollowup,
      markTodoRead,
      removeTodoItem,
      getUnreadTodoCount,
      getTimelineByPatientId,
      getFollowupsByPatientId,
      getTodayFollowupTasks,
      getPatientById,
      getFollowupById,
      getTodoByFollowupId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
