import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Patient, FollowupTask, TodoItem } from '@/types';
import { mockPatients } from '@/data/mockPatients';
import { mockFollowupTasks, mockTodoItems } from '@/data/mockFollowups';

interface AppContextType {
  patients: Patient[];
  followupTasks: FollowupTask[];
  todoItems: TodoItem[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addFollowupTask: (task: Omit<FollowupTask, 'id' | 'createdAt'>) => void;
  updateFollowupTask: (id: string, updates: Partial<FollowupTask>) => void;
  markTodoRead: (id: string) => void;
  getUnreadTodoCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [followupTasks, setFollowupTasks] = useState<FollowupTask[]>(mockFollowupTasks);
  const [todoItems, setTodoItems] = useState<TodoItem[]>(mockTodoItems);

  const addPatient = useCallback((patient: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...patient,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPatients(prev => [newPatient, ...prev]);
    console.log('[AppContext] Added new patient:', newPatient.name);
  }, []);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
    console.log('[AppContext] Updated patient:', id);
  }, []);

  const addFollowupTask = useCallback((task: Omit<FollowupTask, 'id' | 'createdAt'>) => {
    const newTask: FollowupTask = {
      ...task,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setFollowupTasks(prev => [newTask, ...prev]);
    console.log('[AppContext] Added new followup task for:', task.patientName);
  }, []);

  const updateFollowupTask = useCallback((id: string, updates: Partial<FollowupTask>) => {
    setFollowupTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
    console.log('[AppContext] Updated followup task:', id);
  }, []);

  const markTodoRead = useCallback((id: string) => {
    setTodoItems(prev => prev.map(t => 
      t.id === id ? { ...t, isRead: true } : t
    ));
    console.log('[AppContext] Marked todo as read:', id);
  }, []);

  const getUnreadTodoCount = useCallback(() => {
    return todoItems.filter(t => !t.isRead).length;
  }, [todoItems]);

  return (
    <AppContext.Provider value={{
      patients,
      followupTasks,
      todoItems,
      addPatient,
      updatePatient,
      addFollowupTask,
      updateFollowupTask,
      markTodoRead,
      getUnreadTodoCount
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
