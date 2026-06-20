import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { Patient, FollowupTask, TodoItem, TimelineRecord, DoctorAction, ObservationItem, ObservationType } from '@/types';
import { mockPatients } from '@/data/mockPatients';
import { mockFollowupTasks, mockTodoItems, mockTimelines, followupPlanTemplates } from '@/data/mockFollowups';
import { isToday, isOverdue, addDays, formatDate } from '@/utils/date';

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

export const HIGH_SCORE_THRESHOLD = 5;

export const getHighScoreObservations = (observations: ObservationItem[]): ObservationItem[] => {
  return observations.filter(o => (o.value ?? 0) > (o.threshold ?? HIGH_SCORE_THRESHOLD));
};

export const observationLabel: Record<ObservationType, string> = {
  pain: '疼痛',
  swelling: '肿胀',
  bleeding: '渗血',
  occlusion: '咬合'
};

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
  addFollowupPlanBatch: (patientId: string, templateIndex?: number) => string[];
  getHighScoreFollowupTasks: () => FollowupTask[];
  completeRevisitReminder: (patientId: string, result?: string) => void;
  rescheduleRevisitReminder: (patientId: string, newDate: string) => void;
  getFollowupPlanTemplates: () => typeof followupPlanTemplates;
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

  const getHighScoreFollowupTasks = useCallback((): FollowupTask[] => {
    return followupTasks.filter(f => f.status === 'pending' && getHighScoreObservations(f.observations).length > 0);
  }, [followupTasks]);

  const getTodoByFollowupId = useCallback((followupId: string): TodoItem | undefined => {
    const followup = followupTasks.find(f => f.id === followupId);
    if (!followup) return undefined;
    return todoItems.find(t => t.patientId === followup.patientId && t.scheduledDate === followup.scheduledDate);
  }, [followupTasks, todoItems]);

  const getFollowupPlanTemplates = useCallback(() => followupPlanTemplates, []);

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

    const highScoreObs = getHighScoreObservations(task.observations);
    const hasHighScore = highScoreObs.length > 0;
    const highScoreTypes = highScoreObs.map(o => o.type);
    const highScoreDetails = highScoreObs.map(o => ({
      type: o.type,
      name: o.name,
      value: o.value ?? 0,
      threshold: o.threshold ?? HIGH_SCORE_THRESHOLD
    }));

    let type: TodoItem['type'] = 'pending';
    if (task.isAbnormal) type = 'abnormal';
    if (hasHighScore) type = 'highScore';

    const newTodo: TodoItem = {
      id: `todo_f_${task.id}`,
      patientId: task.patientId,
      patientName: task.patientName,
      type,
      title: hasHighScore
        ? `${highScoreObs.map(o => o.name).join('、')}异常高分`
        : task.isAbnormal
          ? '异常需关注'
          : '常规回访',
      description: task.patientSymptoms
        || task.observations.map(o => `${o.name}${o.value ? o.value + '分' : '待评'}`).join('，'),
      priority: hasHighScore ? 'high' : task.isAbnormal ? 'medium' : 'low',
      scheduledDate: task.scheduledDate,
      isRead: false,
      highScoreTypes,
      highScoreDetails,
      followupId: task.id
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
    const newId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
      observations: newTask.observations,
      followupId: newId
    };
    addTimelineRecord(task.patientId, pendingRecord);

    setPatients(prev => prev.map(p => {
      if (p.id !== task.patientId) return p;
      if (p.nextFollowupDate && p.nextFollowupDate > newTask.scheduledDate) return p;
      return { ...p, nextFollowupDate: newTask.scheduledDate };
    }));

    console.log('[AppContext] Added new followup task for:', task.patientName, 'date:', task.scheduledDate);
    return newId;
  }, [generateTodoFromFollowup, addTimelineRecord]);

  const addFollowupPlanBatch = useCallback((patientId: string, templateIndex: number = 0): string[] => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.surgeryDate) return [];

    const template = followupPlanTemplates[templateIndex] || followupPlanTemplates[0];
    const createdIds: string[] = [];
    const now = Date.now();

    template.plans.forEach((plan, idx) => {
      const scheduledDate = addDays(patient.surgeryDate, plan.daysAfterSurgery);
      if (scheduledDate < new Date().toISOString().split('T')[0]) return;

      const taskId = `f_${now}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
      const observations = plan.observations.map(o => ({
        type: o.type,
        name: o.name,
        threshold: o.threshold
      }));

      const newTask: FollowupTask = {
        id: taskId,
        patientId,
        patientName: patient.name,
        scheduledDate,
        status: 'pending',
        observations,
        isAbnormal: false,
        createdAt: new Date().toISOString().split('T')[0],
        templateName: template.name
      };

      setFollowupTasks(prev => [newTask, ...prev]);
      createdIds.push(taskId);

      const highScoreObs = getHighScoreObservations(observations);
      const hasHighScore = highScoreObs.length > 0;
      const highScoreDetails = highScoreObs.map(o => ({
        type: o.type,
        name: o.name,
        value: o.value ?? 0,
        threshold: o.threshold ?? HIGH_SCORE_THRESHOLD
      }));

      let type: TodoItem['type'] = 'pending';
      if (newTask.isAbnormal) type = 'abnormal';
      if (hasHighScore) type = 'highScore';

      const newTodo: TodoItem = {
        id: `todo_f_${taskId}`,
        patientId,
        patientName: patient.name,
        type,
        title: hasHighScore
          ? `${highScoreObs.map(o => o.name).join('、')}异常高分`
          : newTask.isAbnormal
            ? '异常需关注'
            : `术后${plan.daysAfterSurgery}天回访`,
        description: `观察项：${observations.map(o => o.name).join('、')}`,
        priority: hasHighScore ? 'high' : newTask.isAbnormal ? 'medium' : 'low',
        scheduledDate,
        isRead: false,
        highScoreTypes: highScoreObs.map(o => o.type),
        highScoreDetails,
        followupId: taskId
      };
      setTodoItems(prev => [newTodo, ...prev]);

      const pendingRecord: TimelineRecord = {
        id: `t_${patientId}_pending_${taskId}`,
        date: scheduledDate,
        type: 'pendingFollowup',
        title: `${template.name} · ${plan.name}`,
        description: `观察项：${observations.map(o => o.name).join('、')}`,
        isAbnormal: false,
        observations,
        followupId: taskId
      };
      setTimelines(prev => {
        const existing = prev[patientId] || [];
        return {
          ...prev,
          [patientId]: [pendingRecord, ...existing]
        };
      });
    });

    const allDates = createdIds
      .map((_, i) => addDays(patient.surgeryDate, template.plans[i]?.daysAfterSurgery || 0))
      .concat(followupTasks.filter(f => f.patientId === patientId && f.status === 'pending').map(f => f.scheduledDate))
      .filter(Boolean)
      .sort();

    if (allDates.length > 0) {
      setPatients(prev => prev.map(p =>
        p.id === patientId
          ? { ...p, nextFollowupDate: allDates[0] }
          : p
      ));
    }

    console.log('[AppContext] Batch created followup plan:', template.name, 'count:', createdIds.length);
    return createdIds;
  }, [patients, followupTasks]);

  const updateFollowupTask = useCallback((id: string, updates: Partial<FollowupTask>) => {
    setFollowupTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
    console.log('[AppContext] Updated followup task:', id);
  }, []);

  const completeRevisitReminder = useCallback((patientId: string, result?: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId || !p.revisitReminder) return p;
      return {
        ...p,
        revisitReminder: {
          ...p.revisitReminder,
          completed: true,
          result
        }
      };
    }));

    setTodoItems(prev => prev.filter(t => !(t.patientId === patientId && t.type === 'revisit')));

    const today = new Date().toISOString().split('T')[0];
    const revisitRecord: TimelineRecord = {
      id: `t_${patientId}_revisit_${Date.now()}`,
      date: today,
      type: 'revisit',
      title: '复诊完成',
      description: result || '患者已按建议完成复诊，继续观察恢复情况',
      isAbnormal: false,
      doctorNotes: result
    };
    addTimelineRecord(patientId, revisitRecord);

    console.log('[AppContext] Completed revisit reminder for:', patientId);
  }, [addTimelineRecord]);

  const rescheduleRevisitReminder = useCallback((patientId: string, newDate: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId || !p.revisitReminder) return p;
      const newRescheduledCount = (p.revisitReminder.rescheduledCount ?? 0);
      return {
        ...p,
        revisitReminder: {
          ...p.revisitReminder,
          scheduledDate: newDate,
          rescheduledCount: newRescheduledCount + 1
        }
      };
    }));

    setTodoItems(prev => prev.map(t => {
      if (t.patientId === patientId && t.type === 'revisit') {
        return { ...t, scheduledDate: newDate, isRead: false };
      }
      return t;
    }));

    setTimelines(prev => {
      const existing = prev[patientId] || [];
      const record: TimelineRecord = {
        id: `t_${patientId}_revisit_reschedule_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'revisit',
        title: '复诊改期',
        description: `复诊时间已调整至 ${formatDateCN(newDate)}`,
        isAbnormal: false
      };
      return { ...prev, [patientId]: [record, ...existing] };
    });

    console.log('[AppContext] Rescheduled revisit reminder for:', patientId, 'to:', newDate);
  }, []);

  const completeFollowup = useCallback((followupId: string, patientId: string, action: DoctorAction, notes: string) => {
    const today = new Date().toISOString().split('T')[0];
    const followup = followupTasks.find(f => f.id === followupId);

    setFollowupTasks(prev => prev.map(t =>
      t.id === followupId ? {
        ...t,
        status: 'completed' as const,
        doctorAction: action,
        doctorNotes: notes,
        completedAt: today
      } : t
    ));

    if (followup) {
      const highScoreObs = getHighScoreObservations(followup.observations);
      const hasHighScore = highScoreObs.length > 0;

      const record: TimelineRecord = {
        id: `t_${patientId}_f_${Date.now()}`,
        date: today,
        type: 'followup',
        title: `回访完成 - ${actionTextMap[action]}`,
        description: notes || `${actionTextMap[action]}${hasHighScore ? '，存在异常指标' : '，患者恢复良好'}`,
        isAbnormal: hasHighScore,
        action,
        observations: followup.observations.filter(o => o.value !== undefined),
        followupId,
        doctorNotes: notes,
        patientSymptoms: followup.patientSymptoms,
        highScoreObservations: highScoreObs
      };
      setTimelines(prev => {
        const existing = prev[patientId] || [];
        const filtered = existing.filter(r => r.followupId !== followupId);
        return {
          ...prev,
          [patientId]: [record, ...filtered]
        };
      });

      if (action === 'revisit') {
        const revisitDate = addDays(today, 7);
        setPatients(prev => prev.map(p => {
          if (p.id !== patientId) return p;
          return {
            ...p,
            revisitReminder: {
              id: `revisit_${patientId}_${Date.now()}`,
              scheduledDate: revisitDate,
              completed: false,
              reason: notes || '建议复诊'
            }
          };
        }));

        const revisitTodo: TodoItem = {
          id: `todo_revisit_${patientId}_${Date.now()}`,
          patientId,
          patientName: followup.patientName,
          type: 'revisit',
          title: '建议复诊提醒',
          description: notes || '建议尽快复诊进一步检查',
          priority: 'high',
          scheduledDate: revisitDate,
          isRead: false
        };
        setTodoItems(prev => [revisitTodo, ...prev]);

        const revisitRecord: TimelineRecord = {
          id: `t_${patientId}_revisit_plan_${Date.now()}`,
          date: today,
          type: 'revisit',
          title: '已建议复诊',
          description: `${notes || '医生建议复诊'}，计划复诊时间：${revisitDate}`,
          isAbnormal: true
        };
        setTimelines(prev => {
          const existing = prev[patientId] || [];
          return {
            ...prev,
            [patientId]: [revisitRecord, ...existing]
          };
        });
      }
    }

    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const hasAbnormal = followup?.observations.some(o => (o.value || 0) > (o.threshold ?? HIGH_SCORE_THRESHOLD)) || false;
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
      getTodoByFollowupId,
      addFollowupPlanBatch,
      getHighScoreFollowupTasks,
      completeRevisitReminder,
      rescheduleRevisitReminder,
      getFollowupPlanTemplates
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
