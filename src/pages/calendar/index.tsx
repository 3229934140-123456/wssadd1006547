import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext, getHighScoreObservations } from '@/store/AppContext';
import {
  formatDateCN, isToday, isOverdue, getDaysDiff, getWeekRange, getMonthRange,
  formatShortDate, getWeekdayCN, addDays, formatDate
} from '@/utils/date';

type ViewMode = 'list' | 'week' | 'month';

interface DayFollowup {
  date: string;
  followups: {
    id: string;
    patientId: string;
    patientName: string;
    isAbnormal: boolean;
    isHighScore: boolean;
    observations: { name: string; value?: number; threshold?: number }[];
    symptoms?: string;
  }[];
  overdueCount: number;
  todayCount: number;
  abnormalCount: number;
  highScoreCount: number;
}

const CalendarPage: React.FC = () => {
  const { followupTasks } = useAppContext();
  const [expandedDate, setExpandedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [cursorDate, setCursorDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
          abnormalCount: 0,
          highScoreCount: 0
        });
      }
      const day = dateMap.get(task.scheduledDate)!;
      const isOverdueDay = isOverdue(task.scheduledDate);
      const isTodayDay = isToday(task.scheduledDate);
      const highScoreObs = getHighScoreObservations(task.observations);
      const isHighScore = highScoreObs.length > 0;

      day.followups.push({
        id: task.id,
        patientId: task.patientId,
        patientName: task.patientName,
        isAbnormal: task.isAbnormal,
        isHighScore,
        observations: task.observations.map(o => ({ name: o.name, value: o.value, threshold: o.threshold })),
        symptoms: task.patientSymptoms
      });

      if (isOverdueDay) day.overdueCount++;
      if (isTodayDay) day.todayCount++;
      if (task.isAbnormal) day.abnormalCount++;
      if (isHighScore) day.highScoreCount++;
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
      abnormal: pending.filter(f => f.isAbnormal).length,
      highScore: pending.filter(f => getHighScoreObservations(f.observations).length > 0).length
    };
  }, [followupTasks]);

  const weekRange = useMemo(() => getWeekRange(cursorDate), [cursorDate]);
  const monthRange = useMemo(() => getMonthRange(cursorDate), [cursorDate]);

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

  const getDayByDate = (date: string): DayFollowup | undefined => {
    return groupedByDate.find(d => d.date === date);
  };

  const renderList = () => (
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
                  {day.overdueCount > 0 && !dayIsOverdue && (
                    <Text className={classnames(styles.dayTag, styles.overdueTag)}>
                      逾期 {day.overdueCount}
                    </Text>
                  )}
                  {day.highScoreCount > 0 && (
                    <Text className={classnames(styles.dayTag, styles.abnormalTag)}>
                      🔥 高分 {day.highScoreCount}
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
                      followup.isHighScore && styles.abnormalCard,
                      dayIsOverdue && styles.overdueCard
                    )}
                    onClick={() => handleFollowupClick(followup.id, followup.patientId)}
                  >
                    <View className={styles.cardTop}>
                      <Text className={styles.patientName}>{followup.patientName}</Text>
                      {followup.isHighScore ? (
                        <Text className={styles.abnormalBadge}>异常高分</Text>
                      ) : followup.isAbnormal && (
                        <Text className={styles.abnormalBadge}>异常</Text>
                      )}
                    </View>

                    <View className={styles.obsList}>
                      {followup.observations.map((obs, i) => {
                        const isHigh = (obs.value ?? 0) >= (obs.threshold ?? 5);
                        return (
                          <View
                            key={i}
                            className={classnames(
                              styles.obsItem,
                              isHigh && styles.highScore
                            )}
                          >
                            <Text className={styles.obsName}>{obs.name}</Text>
                            {obs.value !== undefined && (
                              <Text className={styles.obsValue}>{obs.value}分</Text>
                            )}
                          </View>
                        );
                      })}
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
  );

  const renderWeekView = () => (
    <View className={styles.gridView}>
      <View className={styles.weekRow}>
        {weekRange.map(date => {
          const day = getDayByDate(date);
          const dayIsToday = isToday(date);
          const dayIsOverdue = isOverdue(date) && !dayIsToday;
          const isExpanded = expandedDate === date;

          return (
            <View
              key={date}
              className={classnames(
                styles.weekCell,
                dayIsToday && styles.cellToday,
                dayIsOverdue && styles.cellOverdue,
                isExpanded && styles.cellExpanded
              )}
              onClick={() => toggleDay(date)}
            >
              <Text className={classnames(styles.cellWeekday, dayIsToday && styles.todayText)}>
                {getWeekdayCN(date)}
              </Text>
              <Text className={classnames(styles.cellDate, dayIsToday && styles.todayText, dayIsOverdue && styles.overdueText)}>
                {formatShortDate(date)}
              </Text>
              {day && (
                <View className={styles.cellBadges}>
                  {day.overdueCount > 0 && (
                    <Text className={classnames(styles.cellBadge, styles.cellOverdueBadge)}>{day.overdueCount}</Text>
                  )}
                  {day.highScoreCount > 0 && (
                    <Text className={classnames(styles.cellBadge, styles.cellAbnormalBadge)}>{day.highScoreCount}</Text>
                  )}
                  {!day.overdueCount && !day.highScoreCount && day.followups.length > 0 && (
                    <Text className={classnames(styles.cellBadge, styles.cellCountBadge)}>{day.followups.length}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.expandedDetail}>
        {expandedDate && getDayByDate(expandedDate) ? (
          <View>
            <View className={styles.detailHeader}>
              <Text className={styles.detailDate}>
                {formatDateCN(expandedDate)}
                {isToday(expandedDate) && ' · 今日'}
                {isOverdue(expandedDate) && !isToday(expandedDate) && ` · 逾期${getDaysDiff(expandedDate, todayStr)}天`}
              </Text>
              <View className={styles.detailStats}>
                {getDayByDate(expandedDate)!.overdueCount > 0 && (
                  <Text className={classnames(styles.dayTag, styles.overdueTag)}>
                    逾期 {getDayByDate(expandedDate)!.overdueCount}
                  </Text>
                )}
                {isToday(expandedDate) && getDayByDate(expandedDate)!.todayCount > 0 && (
                  <Text className={classnames(styles.dayTag, styles.todayTag)}>
                    今日 {getDayByDate(expandedDate)!.todayCount}
                  </Text>
                )}
                {getDayByDate(expandedDate)!.highScoreCount > 0 && (
                  <Text className={classnames(styles.dayTag, styles.abnormalTag)}>
                    🔥 高分 {getDayByDate(expandedDate)!.highScoreCount}
                  </Text>
                )}
              </View>
            </View>
            <View className={styles.dayList}>
              {getDayByDate(expandedDate)!.followups.map(followup => {
                const dayIsOverdue = isOverdue(expandedDate);
                return (
                  <View
                    key={followup.id}
                    className={classnames(
                      styles.followupCard,
                      followup.isHighScore && styles.abnormalCard,
                      dayIsOverdue && styles.overdueCard
                    )}
                    onClick={() => handleFollowupClick(followup.id, followup.patientId)}
                  >
                    <View className={styles.cardTop}>
                      <Text className={styles.patientName}>{followup.patientName}</Text>
                      {followup.isHighScore ? (
                        <Text className={styles.abnormalBadge}>异常高分</Text>
                      ) : followup.isAbnormal && (
                        <Text className={styles.abnormalBadge}>异常</Text>
                      )}
                    </View>
                    <View className={styles.obsList}>
                      {followup.observations.map((obs, i) => {
                        const isHigh = (obs.value ?? 0) >= (obs.threshold ?? 5);
                        return (
                          <View key={i} className={classnames(styles.obsItem, isHigh && styles.highScore)}>
                            <Text className={styles.obsName}>{obs.name}</Text>
                            {obs.value !== undefined && (
                              <Text className={styles.obsValue}>{obs.value}分</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                    {followup.symptoms && (
                      <Text className={styles.symptoms}>{followup.symptoms}</Text>
                    )}
                    <View className={styles.cardBottom}>
                      <Text className={styles.actionHint}>点击进入回访详情处理</Text>
                      <View className={styles.arrowBtn}>处理 ›</View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className={styles.emptyDay}>
            {expandedDate ? (
              <>
                <Text className={styles.emptyDayDate}>{formatDateCN(expandedDate)}</Text>
                <Text className={styles.emptyDayText}>暂无回访计划</Text>
              </>
            ) : (
              <Text className={styles.emptyDayText}>点击上方日期查看当日回访</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderMonthView = () => {
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    const firstDate = monthRange[0];
    const startDay = new Date(firstDate).getDay();
    const startPad = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < startPad; i++) currentWeek.push('');
    for (const date of monthRange) {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push('');
      weeks.push(currentWeek);
    }

    return (
      <View className={styles.gridView}>
        <View className={styles.weekdayHeader}>
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <Text key={d} className={styles.weekdayLabel}>{d}</Text>
          ))}
        </View>
        <View className={styles.monthGrid}>
          {weeks.flat().map((date, idx) => {
            if (!date) return <View key={idx} className={styles.monthCellEmpty} />;
            const day = getDayByDate(date);
            const dayIsToday = isToday(date);
            const dayIsOverdue = isOverdue(date) && !dayIsToday;
            const isExpanded = expandedDate === date;

            return (
              <View
                key={idx}
                className={classnames(
                  styles.monthCell,
                  dayIsToday && styles.cellToday,
                  dayIsOverdue && styles.cellOverdue,
                  isExpanded && styles.cellExpanded
                )}
                onClick={() => toggleDay(date)}
              >
                <Text className={classnames(styles.cellDate, dayIsToday && styles.todayText, dayIsOverdue && styles.overdueText)}>
                  {parseInt(date.split('-')[2])}
                </Text>
                {day && (
                  <View className={styles.cellBadges}>
                    {day.overdueCount > 0 && (
                      <Text className={classnames(styles.cellBadge, styles.cellOverdueBadge)}>{day.overdueCount}</Text>
                    )}
                    {day.highScoreCount > 0 && (
                      <Text className={classnames(styles.cellBadge, styles.cellAbnormalBadge)}>{day.highScoreCount}</Text>
                    )}
                    {!day.overdueCount && !day.highScoreCount && day.followups.length > 0 && (
                      <Text className={classnames(styles.cellBadge, styles.cellCountBadge)}>{day.followups.length}</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View className={styles.expandedDetail}>
          {expandedDate && getDayByDate(expandedDate) ? (
            <View>
              <View className={styles.detailHeader}>
                <Text className={styles.detailDate}>
                  {formatDateCN(expandedDate)}
                  {isToday(expandedDate) && ' · 今日'}
                  {isOverdue(expandedDate) && !isToday(expandedDate) && ` · 逾期${getDaysDiff(expandedDate, todayStr)}天`}
                </Text>
                <View className={styles.detailStats}>
                  {getDayByDate(expandedDate)!.overdueCount > 0 && (
                    <Text className={classnames(styles.dayTag, styles.overdueTag)}>
                      逾期 {getDayByDate(expandedDate)!.overdueCount}
                    </Text>
                  )}
                  {getDayByDate(expandedDate)!.todayCount > 0 && (
                    <Text className={classnames(styles.dayTag, styles.todayTag)}>
                      今日 {getDayByDate(expandedDate)!.todayCount}
                    </Text>
                  )}
                  {getDayByDate(expandedDate)!.highScoreCount > 0 && (
                    <Text className={classnames(styles.dayTag, styles.abnormalTag)}>
                      🔥 高分 {getDayByDate(expandedDate)!.highScoreCount}
                    </Text>
                  )}
                </View>
              </View>
              <View className={styles.dayList}>
                {getDayByDate(expandedDate)!.followups.map(followup => {
                  const dayIsOverdue = isOverdue(expandedDate);
                  return (
                    <View
                      key={followup.id}
                      className={classnames(
                        styles.followupCard,
                        followup.isHighScore && styles.abnormalCard,
                        dayIsOverdue && styles.overdueCard
                      )}
                      onClick={() => handleFollowupClick(followup.id, followup.patientId)}
                    >
                      <View className={styles.cardTop}>
                        <Text className={styles.patientName}>{followup.patientName}</Text>
                        {followup.isHighScore ? (
                          <Text className={styles.abnormalBadge}>异常高分</Text>
                        ) : followup.isAbnormal && (
                          <Text className={styles.abnormalBadge}>异常</Text>
                        )}
                      </View>
                      <View className={styles.obsList}>
                        {followup.observations.map((obs, i) => {
                          const isHigh = (obs.value ?? 0) >= (obs.threshold ?? 5);
                          return (
                            <View key={i} className={classnames(styles.obsItem, isHigh && styles.highScore)}>
                              <Text className={styles.obsName}>{obs.name}</Text>
                              {obs.value !== undefined && (
                                <Text className={styles.obsValue}>{obs.value}分</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                      {followup.symptoms && (
                        <Text className={styles.symptoms}>{followup.symptoms}</Text>
                      )}
                      <View className={styles.cardBottom}>
                        <Text className={styles.actionHint}>点击进入回访详情处理</Text>
                        <View className={styles.arrowBtn}>处理 ›</View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View className={styles.emptyDay}>
              {expandedDate ? (
                <>
                  <Text className={styles.emptyDayDate}>{formatDateCN(expandedDate)}</Text>
                  <Text className={styles.emptyDayText}>暂无回访计划</Text>
                </>
              ) : (
                <Text className={styles.emptyDayText}>点击日期查看当日回访</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const goPrev = () => {
    if (viewMode === 'week') {
      setCursorDate(prev => addDays(prev, -7));
    } else if (viewMode === 'month') {
      const d = new Date(cursorDate);
      d.setMonth(d.getMonth() - 1);
      setCursorDate(formatDate(d.toISOString().split('T')[0]));
    }
  };

  const goNext = () => {
    if (viewMode === 'week') {
      setCursorDate(prev => addDays(prev, 7));
    } else if (viewMode === 'month') {
      const d = new Date(cursorDate);
      d.setMonth(d.getMonth() + 1);
      setCursorDate(formatDate(d.toISOString().split('T')[0]));
    }
  };

  const cursorLabel = useMemo(() => {
    if (viewMode === 'list') return '';
    const d = new Date(cursorDate);
    return viewMode === 'week'
      ? `${d.getFullYear()}年${d.getMonth() + 1}月第${Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay() === 0 ? 6 : new Date(d.getFullYear(), d.getMonth(), 1).getDay() - 1)) / 7)}周`
      : `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [cursorDate, viewMode]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.title}>回访计划日历</Text>
            <Text className={styles.subtitle}>按日期查看每日需跟进的患者</Text>
          </View>
          {viewMode !== 'list' && (
            <View className={styles.navBtns}>
              <Button className={styles.navBtn} onClick={goPrev}>‹</Button>
              <Text className={styles.cursorLabel}>{cursorLabel}</Text>
              <Button className={styles.navBtn} onClick={goNext}>›</Button>
            </View>
          )}
        </View>

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
            <Text className={styles.statNum}>{stats.highScore}</Text>
            <Text className={styles.statLabel}>异常高分</Text>
          </View>
        </View>

        <View className={styles.viewSwitcher}>
          {(['list', 'week', 'month'] as ViewMode[]).map(mode => (
            <Button
              key={mode}
              className={classnames(styles.viewBtn, viewMode === mode && styles.viewActive)}
              onClick={() => { setViewMode(mode); setExpandedDate(mode === 'list' ? todayStr : null); }}
            >
              {mode === 'list' ? '列表' : mode === 'week' ? '周视图' : '月视图'}
            </Button>
          ))}
        </View>
      </View>

      {viewMode === 'list' && renderList()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </View>
  );
};

export default CalendarPage;
