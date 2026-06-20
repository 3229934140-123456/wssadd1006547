import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext, observationLabel, HIGH_SCORE_THRESHOLD } from '@/store/AppContext';
import { isToday, isOverdue, getRelativeDateLabel, formatDateCN, getDaysDiff, addDays } from '@/utils/date';
import type { TodoItem } from '@/types';

type TabType = 'all' | 'workspace' | 'overdue' | 'today' | 'highScore' | 'abnormal' | 'revisit' | 'unread' | 'pending';
type RevisitAction = 'complete' | 'reschedule' | null;

const priorityText: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
};

const typeText: Record<string, string> = {
  abnormal: '异常',
  pending: '待回访',
  urgent: '逾期紧急',
  highScore: '异常高分',
  revisit: '建议复诊'
};

const TodoPage: React.FC = () => {
  const { todoItems, followupTasks, markTodoRead, getUnreadTodoCount, completeRevisitReminder, rescheduleRevisitReminder } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRevisitModal, setShowRevisitModal] = useState(false);
  const [selectedRevisitTodo, setSelectedRevisitTodo] = useState<TodoItem | null>(null);
  const [revisitAction, setRevisitAction] = useState<RevisitAction>(null);
  const [revisitResult, setRevisitResult] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');

  const unreadCount = getUnreadTodoCount();

  const todayFollowups = useMemo(() => {
    return followupTasks.filter(f => f.status === 'pending' && isToday(f.scheduledDate));
  }, [followupTasks]);

  const overdueCount = useMemo(() => {
    return todoItems.filter(t => isOverdue(t.scheduledDate)).length;
  }, [todoItems]);

  const highScoreCount = useMemo(() => {
    return todoItems.filter(t => t.type === 'highScore').length;
  }, [todoItems]);

  const revisitCount = useMemo(() => {
    return todoItems.filter(t => t.type === 'revisit').length;
  }, [todoItems]);

  const workspaceGroups = useMemo(() => {
    const overdue = todoItems.filter(t => isOverdue(t.scheduledDate));
    const today = todoItems.filter(t => isToday(t.scheduledDate) && !isOverdue(t.scheduledDate));
    const highScore = todoItems.filter(t => t.type === 'highScore' && !isOverdue(t.scheduledDate) && !isToday(t.scheduledDate));
    const revisit = todoItems.filter(t => t.type === 'revisit' && !isOverdue(t.scheduledDate) && !isToday(t.scheduledDate));
    return [
      { key: 'overdue', label: '⚠️ 逾期回访', items: overdue, color: '#B45309' },
      { key: 'today', label: '📅 今日回访', items: today, color: '#0F766E' },
      { key: 'highScore', label: '🔥 异常高分', items: highScore, color: '#EF4444' },
      { key: 'revisit', label: '💜 复诊提醒', items: revisit, color: '#7C3AED' }
    ];
  }, [todoItems]);

  const workspaceTotal = workspaceGroups.reduce((sum, g) => sum + g.items.length, 0);

  const filteredTodos = useMemo(() => {
    let result = [...todoItems];

    switch (activeTab) {
      case 'overdue':
        result = result.filter(t => isOverdue(t.scheduledDate));
        break;
      case 'today':
        result = result.filter(t => isToday(t.scheduledDate));
        break;
      case 'highScore':
        result = result.filter(t => t.type === 'highScore');
        break;
      case 'abnormal':
        result = result.filter(t => t.type === 'abnormal');
        break;
      case 'revisit':
        result = result.filter(t => t.type === 'revisit');
        break;
      case 'unread':
        result = result.filter(t => !t.isRead);
        break;
      case 'pending':
        result = result.filter(t => t.type === 'pending');
        break;
    }

    return result.sort((a, b) => {
      const aIsOverdue = isOverdue(a.scheduledDate);
      const bIsOverdue = isOverdue(b.scheduledDate);
      if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;

      const aIsToday = isToday(a.scheduledDate);
      const bIsToday = isToday(b.scheduledDate);
      if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;

      if (a.type !== b.type) {
        const typeOrder = { urgent: 0, highScore: 1, abnormal: 2, revisit: 3, pending: 4 };
        return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
      }

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }

      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }, [todoItems, activeTab]);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  useDidShow(() => {
    console.log('[TodoPage] Page shown, unread todos:', unreadCount,
      'overdue:', overdueCount, 'today followups:', todayFollowups.length);
  });

  const openRevisitModal = useCallback((todo: TodoItem) => {
    setSelectedRevisitTodo(todo);
    setShowRevisitModal(true);
    setRevisitAction(null);
    setRevisitResult('');
    setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 3));
  }, []);

  const handleConfirmRevisitComplete = useCallback(() => {
    if (!selectedRevisitTodo) return;
    completeRevisitReminder(selectedRevisitTodo.patientId, revisitResult.trim() || undefined);
    Taro.showToast({ title: '复诊已完成', icon: 'success' });
    setShowRevisitModal(false);
  }, [selectedRevisitTodo, revisitResult, completeRevisitReminder]);

  const handleConfirmReschedule = useCallback(() => {
    if (!selectedRevisitTodo || !rescheduleDate) return;
    rescheduleRevisitReminder(selectedRevisitTodo.patientId, rescheduleDate);
    Taro.showToast({ title: '改期成功', icon: 'success' });
    setShowRevisitModal(false);
  }, [selectedRevisitTodo, rescheduleDate, rescheduleRevisitReminder]);

  const handleTodoClick = (todo: TodoItem) => {
    if (!todo.isRead) {
      markTodoRead(todo.id);
    }

    if (todo.type === 'revisit') {
      openRevisitModal(todo);
      return;
    }

    const matchingFollowup = todo.followupId
      ? followupTasks.find(f => f.id === todo.followupId && f.status === 'pending')
      : followupTasks.find(f =>
        f.patientId === todo.patientId && f.scheduledDate === todo.scheduledDate && f.status === 'pending'
      );

    if (matchingFollowup) {
      Taro.navigateTo({
        url: `/pages/followup-detail/index?id=${matchingFollowup.id}&patientId=${todo.patientId}`
      });
    } else {
      Taro.navigateTo({
        url: `/pages/patient-detail/index?id=${todo.patientId}`
      });
    }
  };

  const tabs: { key: TabType; label: string; badge?: number; isOverdue?: boolean; isHighScore?: boolean; isWorkspace?: boolean }[] = [
    { key: 'all', label: '全部' },
    { key: 'workspace', label: '今日工作台', badge: workspaceTotal, isWorkspace: true },
    { key: 'overdue', label: '逾期', badge: overdueCount, isOverdue: true },
    { key: 'today', label: '今日', badge: todayFollowups.length },
    { key: 'highScore', label: '异常高分', badge: highScoreCount, isHighScore: true },
    { key: 'abnormal', label: '异常' },
    { key: 'revisit', label: '复诊提醒', badge: revisitCount },
    { key: 'unread', label: '未读', badge: unreadCount },
    { key: 'pending', label: '待回访' }
  ];

  const handleGoCalendar = () => {
    Taro.navigateTo({
      url: '/pages/calendar/index'
    });
  };

  const renderHighScoreDetails = (todo: TodoItem) => {
    if (!todo.highScoreDetails || todo.highScoreDetails.length === 0) {
      return todo.highScoreTypes && todo.highScoreTypes.length > 0 ? (
        <View className={styles.highScoreList}>
          {todo.highScoreTypes.map(type => (
            <Text key={type} className={styles.highScoreItem}>
              🔥 {observationLabel[type]} 超过阈值
            </Text>
          ))}
        </View>
      ) : null;
    }

    return (
      <View className={styles.highScoreList}>
        {todo.highScoreDetails.map((detail, idx) => (
          <View key={idx} className={styles.highScoreDetail}>
            <Text className={styles.highScoreName}>🔥 {detail.name}</Text>
            <View className={styles.highScoreValueRow}>
              <Text className={styles.highScoreValue}>{detail.value}分</Text>
              <Text className={styles.highScoreThreshold}>
                (阈值 {detail.threshold}分，超 {detail.value - detail.threshold} 分)
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTodoCard = (todo: TodoItem) => {
    const todoIsOverdue = isOverdue(todo.scheduledDate);
    const todoIsToday = isToday(todo.scheduledDate);
    const todoIsHighScore = todo.type === 'highScore';
    const todoIsRevisit = todo.type === 'revisit';
    const overdueDays = todoIsOverdue ? getDaysDiff(todo.scheduledDate, new Date().toISOString().split('T')[0]) : 0;
    return (
      <View
        key={todo.id}
        className={classnames(
          styles.todoCard,
          !todo.isRead && styles.unread,
          styles[todo.priority],
          todoIsToday && styles.todayCard,
          todoIsOverdue && styles.overdueCard,
          todoIsHighScore && styles.highScoreCard,
          todoIsRevisit && styles.revisitCard
        )}
        onClick={() => handleTodoClick(todo)}
      >
        <View className={styles.cardHeader}>
          <View className={styles.patientInfo}>
            <Text className={styles.patientName}>{todo.patientName}</Text>
            <View>
              <Text className={classnames(
                styles.typeTag,
                todoIsHighScore && styles.highScoreTypeTag,
                todoIsRevisit && styles.revisitTypeTag
              )}>
                {typeText[todo.type]}
              </Text>
              {todoIsOverdue && (
                <Text className={styles.overdueTag}>逾期{overdueDays}天</Text>
              )}
              {todoIsToday && !todoIsOverdue && (
                <Text className={styles.todayTag}>今日待处理</Text>
              )}
              {todoIsRevisit && !todoIsOverdue && !todoIsToday && (
                <Text className={styles.revisitTag}>建议复诊</Text>
              )}
              <Text className={styles.todoTitle}>{todo.title}</Text>
            </View>
          </View>
          <View className={classnames(
            styles.priorityBadge,
            todoIsOverdue ? styles.overdue : todoIsHighScore ? styles.highScore : todoIsRevisit ? styles.revisit : styles[todo.priority]
          )}>
            {todoIsOverdue ? '逾期' : todoIsHighScore ? '高分' : todoIsRevisit ? '复诊' : priorityText[todo.priority]}
          </View>
        </View>

        {todoIsHighScore && renderHighScoreDetails(todo)}

        <Text className={styles.description}>{todo.description}</Text>

        <View className={styles.cardFooter}>
          <Text className={classnames(
            styles.dateInfo,
            todoIsOverdue && styles.overdueText,
            todoIsRevisit && styles.revisitText
          )}>
            {todoIsOverdue
              ? `已逾期 ${overdueDays} 天`
              : todoIsToday
                ? '今日需处理'
                : `${getRelativeDateLabel(todo.scheduledDate)} · ${formatDateCN(todo.scheduledDate)}`}
          </Text>
          <Button className={classnames(
            styles.actionBtn,
            todoIsOverdue && styles.overdueBtn,
            todoIsHighScore && styles.highScoreBtn,
            todoIsRevisit && styles.revisitBtn
          )}>
            {todoIsRevisit ? '处理复诊' : todoIsOverdue ? '立即处理' : todoIsToday ? '立即处理' : '查看详情'}
          </Button>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.title}>
              待办事项
              {unreadCount > 0 && (
                <Text className={styles.unreadCount}>{unreadCount} 条未读</Text>
              )}
            </Text>
            <Text className={styles.subtitle}>
              {overdueCount > 0
                ? `有 ${overdueCount} 条逾期回访，请尽快处理`
                : todayFollowups.length > 0
                  ? `今日有 ${todayFollowups.length} 条回访待处理，请及时跟进`
                  : '及时处理异常情况，保障患者恢复'}
            </Text>
          </View>
          <Button className={styles.calendarBtn} onClick={handleGoCalendar}>
            📅
          </Button>
        </View>

        {overdueCount > 0 && (
          <View className={styles.overdueAlert}>
            <Text className={styles.overdueAlertIcon}>⚠️</Text>
            <Text className={styles.overdueAlertText}>
              {overdueCount} 条回访已逾期，请优先处理
            </Text>
          </View>
        )}
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            className={classnames(
              styles.tabBtn,
              activeTab === tab.key && styles.active,
              tab.isOverdue && tab.badge && tab.badge > 0 && styles.overdueTab,
              tab.key === 'today' && tab.badge && tab.badge > 0 && styles.todayTab,
              tab.isHighScore && tab.badge && tab.badge > 0 && styles.highScoreTab,
              tab.isWorkspace && tab.badge && tab.badge > 0 && styles.workspaceTab
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 ? `(${tab.badge})` : ''}
          </Button>
        ))}
      </View>

      <View className={styles.content}>
        {isRefreshing && (
          <View className={styles.listLoading}>刷新中...</View>
        )}

        {!isRefreshing && activeTab === 'workspace' && (
          <View className={styles.workspace}>
            {workspaceTotal === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyTitle}>今日工作已全部完成</Text>
                <Text className={styles.emptyDesc}>所有患者恢复情况良好</Text>
              </View>
            ) : (
              workspaceGroups.map(group => (
                group.items.length > 0 && (
                  <View key={group.key} className={styles.workspaceGroup}>
                    <View className={styles.workspaceGroupHeader}>
                      <Text className={styles.workspaceGroupLabel} style={{ color: group.color }}>
                        {group.label}
                      </Text>
                      <Text className={styles.workspaceGroupCount}>
                        {group.items.length} 条
                      </Text>
                    </View>
                    <View className={styles.workspaceGroupList}>
                      {group.items.map(renderTodoCard)}
                    </View>
                  </View>
                )
              ))
            )}
          </View>
        )}

        {!isRefreshing && activeTab !== 'workspace' && filteredTodos.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyTitle}>暂无待办事项</Text>
            <Text className={styles.emptyDesc}>所有患者恢复情况良好</Text>
          </View>
        )}

        {!isRefreshing && activeTab !== 'workspace' && filteredTodos.length > 0 && (
          <View className={styles.list}>
            {filteredTodos.map(renderTodoCard)}
          </View>
        )}
      </View>

      {showRevisitModal && selectedRevisitTodo && (
        <View className={styles.modalMask} onClick={() => setShowRevisitModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>复诊提醒处理</Text>
            <Text className={styles.modalSubtitle}>
              {selectedRevisitTodo.patientName} · {formatDateCN(selectedRevisitTodo.scheduledDate)}
            </Text>
            <Text className={styles.modalDesc}>{selectedRevisitTodo.description}</Text>

            {!revisitAction ? (
              <View className={styles.actionRow}>
                <Button className={classnames(styles.actionOptionBtn, styles.completeBtn)} onClick={() => setRevisitAction('complete')}>
                  ✅ 确认复诊完成
                </Button>
                <Button className={classnames(styles.actionOptionBtn, styles.rescheduleBtn)} onClick={() => setRevisitAction('reschedule')}>
                  📅 改约时间
                </Button>
                <Button className={styles.modalCancel} onClick={() => setShowRevisitModal(false)}>
                  取消
                </Button>
              </View>
            ) : revisitAction === 'complete' ? (
              <View className={styles.formRow}>
                <Text className={styles.formLabel}>复诊结论（可选）</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请填写复诊结果、处理方案等'
                  value={revisitResult}
                  onInput={e => setRevisitResult(e.detail.value)}
                />
                <View className={styles.formActions}>
                  <Button className={styles.formBack} onClick={() => setRevisitAction(null)}>返回</Button>
                  <Button className={styles.formConfirm} onClick={handleConfirmRevisitComplete}>
                    确认完成
                  </Button>
                </View>
              </View>
            ) : (
              <View className={styles.formRow}>
                <Text className={styles.formLabel}>新复诊日期</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入新日期，格式：2026-06-25'
                  value={rescheduleDate}
                  onInput={e => setRescheduleDate(e.detail.value)}
                />
                <Text className={styles.formHint}>
                  快捷选择：
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 1))}>明天</Text>
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 3))}>3天后</Text>
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 7))}>1周后</Text>
                </Text>
                <View className={styles.formActions}>
                  <Button className={styles.formBack} onClick={() => setRevisitAction(null)}>返回</Button>
                  <Button className={styles.formConfirm} onClick={handleConfirmReschedule}>
                    确认改期
                  </Button>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default TodoPage;
