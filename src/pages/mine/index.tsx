import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppContext } from '@/store/AppContext';

const MinePage: React.FC = () => {
  const { patients, followupTasks, todoItems } = useAppContext();

  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthSurgeries = patients.filter(p => p.createdAt.startsWith(thisMonth)).length;
    const totalFollowups = followupTasks.filter(f => f.status === 'completed').length;
    const abnormalCount = patients.filter(p => p.status === 'abnormal').length;
    const recoveredCount = patients.filter(p => p.status === 'recovered').length;
    
    return {
      totalPatients: patients.length,
      thisMonthSurgeries,
      totalFollowups,
      abnormalCount,
      recoveredCount
    };
  }, [patients, followupTasks]);

  useDidShow(() => {
    console.log('[MinePage] Page shown');
  });

  const menuItems = [
    {
      icon: '📊',
      title: '数据统计',
      desc: '查看手术和回访数据分析',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: '⚙️',
      title: '回访设置',
      desc: '设置默认回访计划和提醒',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: '📱',
      title: '通知设置',
      desc: '管理回访提醒和消息推送',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: '📚',
      title: '医学资料库',
      desc: '种植术后护理指南',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: 'ℹ️',
      title: '关于我们',
      desc: '版本信息和服务介绍',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.doctorInfo}>
          <View className={styles.avatar}>李</View>
          <View className={styles.info}>
            <Text className={styles.name}>李医生</Text>
            <Text className={styles.title}>主治医师 · 口腔种植专科</Text>
            <Text className={styles.hospital}>XX口腔医院</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsSection}>
        <Text className={styles.statsTitle}>本月工作统计</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.thisMonthSurgeries}</Text>
            <Text className={styles.statLabel}>本月手术</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.totalPatients}</Text>
            <Text className={styles.statLabel}>管理患者</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.totalFollowups}</Text>
            <Text className={styles.statLabel}>完成回访</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{stats.recoveredCount}</Text>
            <Text className={styles.statLabel}>已康复</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>功能菜单</Text>
        </View>
        {menuItems.map((item, index) => (
          <View 
            key={index} 
            className={styles.menuItem}
            onClick={item.onClick}
          >
            <View className={styles.menuIcon}>{item.icon}</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>{item.title}</Text>
              <Text className={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>

      <View className={styles.version}>
        种植随访 v1.0.0
      </View>
    </View>
  );
};

export default MinePage;
