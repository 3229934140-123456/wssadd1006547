import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext } from '@/store/AppContext';
import { formatDateCN, isToday, isOverdue, getDaysDiff } from '@/utils/date';

interface DayFollowup {
  date: string;
  followups: {
    id: string;
    patientId: string;
    patientName: string;
    isAbnormal: boolean;
    observations: { name: string; value?: number }[];
    symptoms?: string;
  }[];
  overdueCount: number;
  todayCount: number;
  abnormalCount: number;
}

const CalendarPage: React.FC = () => {
  const { followupTasks, patients } = useAppContext();
  const [expandedDate, setExpandedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  const groupedByDate = useMemo((): DayFollowup[] => {
    const pendingTasks = followupTasks.filter(f => f.status === 'pending');
    const dateMap = new Map<string, DayFollowup>();

    for (const task of pendingTasks) {
      if (!dateMap.has(task.scheduledDate)) {
        dateMap.set(task.scheduledDate, {
          date: task.scheduledDate,
          followups: [],
          overdueCount: 0,
          todayCount: 0,
          abnormalCount: 0
        });
      }
      const day = dateMap.get(task.scheduledDate)!;
      const isOverdueDay = isOverdue(task.scheduledDate);
      const isTodayDay = isToday(task.scheduledDate);

      day.followups.push({
        id: task.id,
        patientId: task.patientId,
        patientName: task.patientName,
        isAbnormal: task.isAbnormal,
        observations: task.observations.map(o => ({ name: o.name, value: o.value })),
        symptoms: task.patientSymptoms
      });

      if (isOverdueDay) day.overdueCount++;
      if (isTodayDay) day.todayCount++;
      if (task.isAbnormal) day.abnormalCount++;
    }

    return Array.from(dateMap.values()).sort((a, b) => {
      const aOverdue = isOverdue(a.date) && !isToday(a.date);
      const bOverdue = isOverdue(b.date) && !isToday(b.date);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      const aIsToday = isToday(a.date);
      const bIsToday = isToday(b.date);
      if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [followupTasks]);

  const stats = useMemo(() => {
    const pending = followupTasks.filter(f => f.status === 'pending');
    return {
      total: pending.length,
      overdue: pending.filter(f => isOverdue(f.scheduledDate)).length,
      today: pending.filter(f => isToday(f.scheduledDate)).length,
      abnormal: pending.filter(f => f.isAbnormal).length
    };
  }, [followupTasks]);

  useDidShow(() => {
    console.log('[CalendarPage] Loaded followups:', stats);
  });

  const handleFollowupClick = (followupId: string, patientId: string) => {
    Taro.navigateTo({
      url: `/pages/followup-detail/index?id=${followupId}&patientId=${patientId}`
    });
  };

  const toggleDay = (date: string) => {
    setExpandedDate(prev => prev === date ? null : date);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>回访计划日历</Text>
        <Text className={styles.subtitle}>按日期查看每日需跟进的患者</Text>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statNum}>{stats.total}</Text>
            <Text className={styles.statLabel}>待回访总数</Text>
          </View>
          {stats.overdue > 0 && (
            <View className={classnames(styles.statCard, styles.overdueStat)}>
              <Text className={styles.statNum}>{stats.overdue}</Text>
              <Text className={styles.statLabel}>逾期</Text>
            </View>
          )}
          <View className={classnames(styles.statCard, styles.todayStat)}>
            <Text className={styles.statNum}>{stats.today}</Text>
            <Text className={styles.statLabel}>今日</Text>
          </View>
          <View className={classnames(styles.statCard, styles.abnormalStat)}>
            <Text className={styles.statNum}>{stats.abnormal}</Text>
            <Text className={styles.statLabel}>异常</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {groupedByDate.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyTitle}>暂无回访计划</Text>
            <Text className={styles.emptyDesc}>前往患者详情页创建回访任务</Text>
          </View>
        )}

        {groupedByDate.length > 0 && groupedByDate.map(day => {
          const dayIsToday = isToday(day.date);
          const dayIsOverdue = isOverdue(day.date) && !dayIsToday;
          const overdueDays = dayIsOverdue ? getDaysDiff(day.date, todayStr) : 0;
          const isExpanded = expandedDate === day.date;

          return (
            <View key={day.date} className={styles.dayBlock}>
              <View
                className={classnames(
                  styles.dayHeader,
                  dayIsToday && styles.todayHeader,
                  dayIsOverdue && styles.overdueHeader,
                  isExpanded && styles.expandedHeader
                )}
                onClick={() => toggleDay(day.date)}
              >
                <View className={styles.dayInfo}>
                  <Text className={classnames(
                    styles.dayDate,
                    dayIsToday && styles.todayText,
                    dayIsOverdue && styles.overdueText
                  )}>
                    {formatDateCN(day.date)}
                  </Text>
                  <View className={styles.dayTags}>
                    {dayIsToday && (
                      <Text className={classnames(styles.dayTag, styles.todayTag)}>今日</Text>
                    )}
                    {dayIsOverdue && (
                      <Text className={classnames(styles.dayTag, styles.overdueTag)}>
                        逾期 {overdueDays} 天
                      </Text>
                    )}
                    {day.abnormalCount > 0 && (
                      <Text className={classnames(styles.dayTag, styles.abnormalTag)}>
                        异常 {day.abnormalCount}
                      </Text>
                    )}
                  </View>
                </View>
                <View className={styles.dayRight}>
                  <Text className={styles.dayCount}>
                    {day.followups.length} 位患者
                  </Text>
                  <Text className={classnames(styles.arrow, isExpanded && styles.expandedArrow)}>
                    ›
                  </Text>
                </View>
              </View>

              {isExpanded && (
                <View className={styles.dayList}>
                  {day.followups.map(followup => (
                    <View
                      key={followup.id}
                      className={classnames(
                        styles.followupCard,
                        followup.isAbnormal && styles.abnormalCard,
                        dayIsOverdue && styles.overdueCard
                      )}
                      onClick={() => handleFollowupClick(followup.id, followup.patientId)}
                    >
                      <View className={styles.cardTop}>
                        <Text className={styles.patientName}>{followup.patientName}</Text>
                        {followup.isAbnormal && (
                          <Text className={styles.abnormalBadge}>异常</Text>
                        )}
                      </View>

                      <View className={styles.obsList}>
                        {followup.observations.map((obs, i) => (
                          <View
                            key={i}
                            className={classnames(
                              styles.obsItem,
                              (obs.value || 0) >= 5 && styles.highScore
                            )}
                          >
                            <Text className={styles.obsName}>{obs.name}</Text>
                            {obs.value !== undefined && (
                              <Text className={styles.obsValue}>{obs.value}分</Text>
                            )}
                          </View>
                        ))}
                      </View>

                      {followup.symptoms && (
                        <Text className={styles.symptoms}>{followup.symptoms}</Text>
                      )}

                      <View className={styles.cardBottom}>
                        <Text className={styles.actionHint}>
                          {dayIsOverdue
                            ? '逾期未处理，点击立即跟进'
                            : dayIsToday
                              ? '今日需处理，点击进入详情'
                              : '点击查看详情'}
                        </Text>
                        <View className={styles.arrowBtn}>处理 ›</View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default CalendarPage;