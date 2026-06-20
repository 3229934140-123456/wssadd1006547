import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext } from '@/store/AppContext';
import { getRelativeDateLabel, formatDateCN } from '@/utils/date';
import type { TodoItem } from '@/types';

type TabType = 'all' | 'unread' | 'abnormal' | 'pending';

const priorityText: Record<string, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级'
};

const typeText: Record<string, string> = {
  abnormal: '异常',
  pending: '待回访',
  urgent: '紧急'
};

const TodoPage: React.FC = () => {
  const { todoItems, markTodoRead, getUnreadTodoCount } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = getUnreadTodoCount();

  const filteredTodos = useMemo(() => {
    let result = [...todoItems];
    
    switch (activeTab) {
      case 'unread':
        result = result.filter(t => !t.isRead);
        break;
      case 'abnormal':
        result = result.filter(t => t.type === 'abnormal');
        break;
      case 'pending':
        result = result.filter(t => t.type === 'pending');
        break;
    }
    
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
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
    console.log('[TodoPage] Page shown, unread todos:', unreadCount);
  });

  const handleTodoClick = (todo: TodoItem) => {
    if (!todo.isRead) {
      markTodoRead(todo.id);
    }
    
    const followupTask = todoItems.find(t => t.id === todo.id);
    if (followupTask) {
      Taro.navigateTo({
        url: `/pages/followup-detail/index?id=${todo.id}&patientId=${todo.patientId}`
      });
    } else {
      Taro.navigateTo({
        url: `/pages/patient-detail/index?id=${todo.patientId}`
      });
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未读' },
    { key: 'abnormal', label: '异常' },
    { key: 'pending', label: '待回访' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>
          待办事项
          {unreadCount > 0 && (
            <Text className={styles.unreadCount}>{unreadCount} 条未读</Text>
          )}
        </Text>
        <Text className={styles.subtitle}>及时处理异常情况，保障患者恢复</Text>
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            className={classnames(styles.tabBtn, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      <View className={styles.content}>
        {isRefreshing && (
          <View className={styles.listLoading}>刷新中...</View>
        )}

        {!isRefreshing && filteredTodos.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyTitle}>暂无待办事项</Text>
            <Text className={styles.emptyDesc}>所有患者恢复情况良好</Text>
          </View>
        )}

        {!isRefreshing && filteredTodos.length > 0 && (
          <View className={styles.list}>
            {filteredTodos.map((todo) => (
              <View
                key={todo.id}
                className={classnames(
                  styles.todoCard,
                  !todo.isRead && styles.unread,
                  styles[todo.priority]
                )}
                onClick={() => handleTodoClick(todo)}
              >
                <View className={styles.cardHeader}>
                  <View className={styles.patientInfo}>
                    <Text className={styles.patientName}>{todo.patientName}</Text>
                    <View>
                      <Text className={styles.typeTag}>{typeText[todo.type]}</Text>
                      <Text className={styles.todoTitle}>{todo.title}</Text>
                    </View>
                  </View>
                  <View className={classnames(styles.priorityBadge, styles[todo.priority])}>
                    {priorityText[todo.priority]}
                  </View>
                </View>

                <Text className={styles.description}>{todo.description}</Text>

                <View className={styles.cardFooter}>
                  <Text className={styles.dateInfo}>
                    {getRelativeDateLabel(todo.scheduledDate)} · {formatDateCN(todo.scheduledDate)}
                  </Text>
                  <Button className={styles.actionBtn}>
                    查看详情
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default TodoPage;
