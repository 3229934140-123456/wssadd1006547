import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import PatientCard from '@/components/PatientCard';
import { useAppContext } from '@/store/AppContext';
import { isToday } from '@/utils/date';

type FilterType = 'all' | 'normal' | 'abnormal' | 'recovered';

const PatientPage: React.FC = () => {
  const { patients, todoItems, getUnreadTodoCount } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredPatients = useMemo(() => {
    let result = [...patients];
    
    if (searchText) {
      result = result.filter(p => 
        p.name.includes(searchText) || 
        p.phone.includes(searchText)
      );
    }
    
    if (filter !== 'all') {
      result = result.filter(p => p.status === filter);
    }
    
    return result.sort((a, b) => {
      if (a.status === 'abnormal' && b.status !== 'abnormal') return -1;
      if (a.status !== 'abnormal' && b.status === 'abnormal') return 1;
      return new Date(b.surgeryDate).getTime() - new Date(a.surgeryDate).getTime();
    });
  }, [patients, searchText, filter]);

  const stats = useMemo(() => {
    const todayFollowups = patients.filter(p => p.nextFollowupDate && isToday(p.nextFollowupDate)).length;
    const abnormalCount = patients.filter(p => p.status === 'abnormal').length;
    return {
      total: patients.length,
      todayFollowups,
      abnormalCount
    };
  }, [patients]);

  usePullDownRefresh(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  useDidShow(() => {
    console.log('[PatientPage] Page shown, unread todos:', getUnreadTodoCount());
  });

  const handleAddPatient = () => {
    Taro.navigateTo({
      url: '/pages/add-patient/index'
    });
  };

  const filterOptions: { key: FilterType; label: string; isAbnormal?: boolean }[] = [
    { key: 'all', label: '全部' },
    { key: 'abnormal', label: '需关注', isAbnormal: true },
    { key: 'normal', label: '恢复中' },
    { key: 'recovered', label: '已康复' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.greeting}>医生您好</Text>
        <Text className={styles.subGreeting}>今天是 {new Date().toLocaleDateString('zh-CN')}</Text>
        
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>总患者数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{stats.todayFollowups}</Text>
            <Text className={styles.statLabel}>今日待回访</Text>
          </View>
          <View className={classnames(styles.statCard, styles.highlight)}>
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
                filter === option.key && (option.isAbnormal ? styles.activeAbnormal : styles.active)
              )}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
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
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </View>

      <View className={styles.addBtn} onClick={handleAddPatient}>
        <Text>+</Text>
      </View>
    </View>
  );
};

export default PatientPage;
