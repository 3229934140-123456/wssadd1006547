import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import PatientCard from '@/components/PatientCard';
import { useAppContext } from '@/store/AppContext';
import { isToday, isOverdue } from '@/utils/date';

type FilterType = 'all' | 'overdue' | 'today' | 'abnormal' | 'normal' | 'recovered';

const PatientPage: React.FC = () => {
  const { patients, followupTasks, todoItems, getUnreadTodoCount, getTodayFollowupTasks } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayFollowupTasks = getTodayFollowupTasks();
  const todayFollowupPatientIds = useMemo(() => {
    return new Set(todayFollowupTasks.map(f => f.patientId));
  }, [todayFollowupTasks]);

  const overduePatientIds = useMemo(() => {
    return new Set(
      followupTasks
        .filter(f => f.status === 'pending' && isOverdue(f.scheduledDate))
        .map(f => f.patientId)
    );
  }, [followupTasks]);

  const filteredPatients = useMemo(() => {
    let result = [...patients];

    if (searchText) {
      result = result.filter(p =>
        p.name.includes(searchText) ||
        p.phone.includes(searchText)
      );
    }

    switch (filter) {
      case 'overdue':
        result = result.filter(p => overduePatientIds.has(p.id));
        break;
      case 'today':
        result = result.filter(p => todayFollowupPatientIds.has(p.id));
        break;
      case 'abnormal':
        result = result.filter(p => p.status === 'abnormal');
        break;
      case 'normal':
        result = result.filter(p => p.status === 'normal');
        break;
      case 'recovered':
        result = result.filter(p => p.status === 'recovered');
        break;
    }

    return result.sort((a, b) => {
      const aOverdue = overduePatientIds.has(a.id);
      const bOverdue = overduePatientIds.has(b.id);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      const aToday = todayFollowupPatientIds.has(a.id);
      const bToday = todayFollowupPatientIds.has(b.id);
      if (aToday !== bToday) return aToday ? -1 : 1;

      if (a.status === 'abnormal' && b.status !== 'abnormal') return -1;
      if (a.status !== 'abnormal' && b.status === 'abnormal') return 1;

      return new Date(b.surgeryDate).getTime() - new Date(a.surgeryDate).getTime();
    });
  }, [patients, searchText, filter, todayFollowupPatientIds, overduePatientIds]);

  const stats = useMemo(() => {
    const abnormalCount = patients.filter(p => p.status === 'abnormal').length;
    return {
      total: patients.length,
      todayFollowups: todayFollowupTasks.length,
      abnormalCount,
      overdueCount: overduePatientIds.size
    };
  }, [patients, todayFollowupTasks, overduePatientIds]);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  useDidShow(() => {
    console.log('[PatientPage] Page shown, unread todos:', getUnreadTodoCount(),
      'today followups:', todayFollowupTasks.length);
  });

  const handleAddPatient = () => {
    Taro.navigateTo({
      url: '/pages/add-patient/index'
    });
  };

  const handleGoCalendar = () => {
    Taro.navigateTo({
      url: '/pages/calendar/index'
    });
  };

  const filterOptions: { key: FilterType; label: string; isAbnormal?: boolean; isToday?: boolean; isOverdue?: boolean; badge?: number }[] = [
    { key: 'all', label: '全部' },
    { key: 'overdue', label: '逾期', isOverdue: true, badge: stats.overdueCount },
    { key: 'today', label: '今日回访', isToday: true, badge: todayFollowupTasks.length },
    { key: 'abnormal', label: '需关注', isAbnormal: true },
    { key: 'normal', label: '恢复中' },
    { key: 'recovered', label: '已康复' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.greeting}>医生您好</Text>
            <Text className={styles.subGreeting}>今天是 {new Date().toLocaleDateString('zh-CN')}</Text>
          </View>
          <Button className={styles.calendarBtn} onClick={handleGoCalendar}>
            📅
          </Button>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>总患者数</Text>
          </View>
          {stats.overdueCount > 0 && (
            <View
              className={classnames(styles.statCard, styles.overdueHighlight)}
              onClick={() => setFilter('overdue')}
            >
              <Text className={styles.statNum}>{stats.overdueCount}</Text>
              <Text className={styles.statLabel}>逾期回访</Text>
            </View>
          )}
          <View
            className={classnames(styles.statCard, stats.todayFollowups > 0 && styles.todayHighlight)}
            onClick={() => {
              if (stats.todayFollowups > 0) {
                setFilter('today');
              }
            }}
          >
            <Text className={styles.statNum}>{stats.todayFollowups}</Text>
            <Text className={styles.statLabel}>今日待回访</Text>
          </View>
          <View
            className={classnames(styles.statCard, styles.highlight)}
            onClick={() => {
              if (stats.abnormalCount > 0) {
                setFilter('abnormal');
              }
            }}
          >
            <Text className={styles.statNum}>{stats.abnormalCount}</Text>
            <Text className={styles.statLabel}>异常待处理</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索患者姓名或电话"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>

        <ScrollView className={styles.filterRow} scrollX enableFlex>
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              className={classnames(
                styles.filterBtn,
                filter === option.key && (
                  option.isAbnormal
                    ? styles.activeAbnormal
                    : option.isOverdue
                      ? styles.activeOverdue
                      : styles.active
                ),
                option.isToday && option.badge > 0 && styles.todayFilter,
                option.isOverdue && option.badge > 0 && styles.overdueFilter
              )}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
              {option.badge && option.badge > 0 ? `(${option.badge})` : ''}
            </Button>
          ))}
        </ScrollView>

        {isRefreshing && (
          <View className={styles.listLoading}>刷新中...</View>
        )}

        {!isRefreshing && filteredPatients.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无患者数据</Text>
          </View>
        )}

        {!isRefreshing && filteredPatients.length > 0 && filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            todayFollowup={todayFollowupTasks.find(f => f.patientId === patient.id)}
            isOverdue={overduePatientIds.has(patient.id)}
          />
        ))}
      </View>

      <View className={styles.addBtn} onClick={handleAddPatient}>
        <Text>+</Text>
      </View>
    </View>
  );
};

export default PatientPage;