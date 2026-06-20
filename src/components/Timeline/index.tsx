import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { TimelineRecord } from '@/types';
import { formatDateCN, isToday, isOverdue, getDaysDiff } from '@/utils/date';
import { HIGH_SCORE_THRESHOLD } from '@/store/AppContext';

interface TimelineProps {
  records: TimelineRecord[];
  patientId?: string;
}

type FilterType = 'all' | 'surgery' | 'pendingFollowup' | 'followup' | 'abnormal' | 'revisit';

const actionText: Record<string, string> = {
  call: '📞 医生电话回访',
  nurse: '👩‍⚕️ 护士代办',
  revisit: '🏥 建议复诊'
};

const typeText: Record<string, string> = {
  surgery: '手术',
  followup: '已回访',
  pendingFollowup: '待回访',
  note: '备注',
  revisit: '复诊'
};

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'surgery', label: '手术' },
  { key: 'pendingFollowup', label: '待回访' },
  { key: 'followup', label: '已回访' },
  { key: 'abnormal', label: '异常沟通' },
  { key: 'revisit', label: '复诊' }
];

const Timeline: React.FC<TimelineProps> = ({ records, patientId }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredRecords = useMemo(() => {
    let result = [...records];

    switch (activeFilter) {
      case 'surgery':
        result = result.filter(r => r.type === 'surgery');
        break;
      case 'pendingFollowup':
        result = result.filter(r => r.type === 'pendingFollowup');
        break;
      case 'followup':
        result = result.filter(r => r.type === 'followup');
        break;
      case 'abnormal':
        result = result.filter(r => r.type === 'followup' && r.isAbnormal);
        break;
      case 'revisit':
        result = result.filter(r => r.type === 'revisit');
        break;
    }

    return result.sort((a, b) => {
      if (a.type === 'pendingFollowup' && b.type !== 'pendingFollowup') return -1;
      if (a.type !== 'pendingFollowup' && b.type === 'pendingFollowup') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [records, activeFilter]);

  const isHighValue = (obs: { value?: number; threshold?: number }) => {
    if (obs.value === undefined) return false;
    const threshold = obs.threshold ?? HIGH_SCORE_THRESHOLD;
    return obs.value >= threshold;
  };

  const handlePendingClick = (record: TimelineRecord) => {
    if (record.type !== 'pendingFollowup' || !patientId) return;
    if (record.followupId) {
      Taro.navigateTo({
        url: `/pages/followup-detail/index?id=${record.followupId}&patientId=${patientId}`
      });
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.filterBar}>
        {filters.map((filter) => (
          <Button
            key={filter.key}
            className={classnames(
              styles.filterBtn,
              activeFilter === filter.key && styles.active
            )}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </View>

      <View className={styles.timeline}>
        {filteredRecords.length === 0 && (
          <View className={styles.empty}>
            暂无相关记录
          </View>
        )}

        {filteredRecords.map((record) => {
          const isPendingOverdue = record.type === 'pendingFollowup' && isOverdue(record.date);
          const isPendingToday = record.type === 'pendingFollowup' && isToday(record.date);
          const overdueDays = isPendingOverdue
            ? getDaysDiff(record.date, new Date().toISOString().split('T')[0])
            : 0;

          const highScoreObs = (record.highScoreObservations && record.highScoreObservations.length > 0)
            ? record.highScoreObservations
            : (record.observations || []).filter(o => isHighValue(o));

          return (
            <View
              key={record.id}
              className={classnames(
                styles.item,
                record.type === 'pendingFollowup' && styles.pendingItem,
                record.type === 'revisit' && styles.revisitItem,
                record.type === 'followup' && record.isAbnormal && styles.abnormalFollowupItem
              )}
              onClick={() => handlePendingClick(record)}
            >
              <View className={classnames(
                styles.node,
                record.type === 'revisit'
                  ? styles.revisit
                  : record.isAbnormal && record.type !== 'pendingFollowup'
                    ? styles.abnormal
                    : record.type === 'surgery'
                      ? styles.surgery
                      : record.type === 'pendingFollowup'
                        ? isPendingOverdue
                          ? styles.overdue
                          : styles.pending
                        : styles.normal
              )}>
                <View className={styles.dot}></View>
              </View>

              <View className={classnames(
                styles.content,
                record.type === 'pendingFollowup' && styles.pendingContent,
                isPendingOverdue && styles.overdueContent,
                record.type === 'revisit' && styles.revisitContent
              )}>
                <View className={styles.header}>
                  <Text className={classnames(
                    styles.date,
                    isPendingOverdue && styles.overdueText
                  )}>
                    {formatDateCN(record.date)}
                    {isPendingToday && (
                      <Text className={styles.todayTag}>今日</Text>
                    )}
                    {isPendingOverdue && (
                      <Text className={styles.overdueTag}>逾期{overdueDays}天</Text>
                    )}
                  </Text>
                  <View className={classnames(
                    styles.typeTag,
                    styles[record.type],
                    isPendingOverdue && styles.overdueTagStyle
                  )}>
                    {typeText[record.type]}
                  </View>
                </View>

                <View className={styles.title}>
                  {record.title}
                  {record.type === 'followup' && record.isAbnormal && (
                    <Text className={styles.abnormalBadge}>异常沟通</Text>
                  )}
                  {record.type === 'pendingFollowup' && (
                    <Text className={styles.pendingBadge}>待处理</Text>
                  )}
                  {record.type === 'revisit' && (
                    <Text className={styles.revisitBadge}>复诊</Text>
                  )}
                </View>

                <View className={styles.description}>{record.description}</View>

                {record.patientSymptoms && record.type === 'followup' && (
                  <View className={styles.symptomBox}>
                    <Text className={styles.symptomLabel}>患者自述：</Text>
                    <Text className={styles.symptomText}>{record.patientSymptoms}</Text>
                  </View>
                )}

                {record.observations && record.observations.length > 0 && (
                  <View className={styles.observations}>
                    {record.observations.map((obs, index) => {
                      const isHigh = isHighValue(obs);
                      return (
                        <View
                          key={index}
                          className={classnames(styles.obsItem, isHigh && styles.high)}
                        >
                          <Text className={styles.obsName}>{obs.name}</Text>
                          {obs.value !== undefined && (
                            <Text className={classnames(styles.value, isHigh && styles.highValue)}>
                              {obs.value}分
                              {isHigh && (
                                <Text className={styles.highMarker}> 超阈值</Text>
                              )}
                            </Text>
                          )}
                          {obs.value === undefined && (
                            <Text className={styles.pendingValue}>待评</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {record.action && (
                  <View className={styles.actionRow}>
                    <View className={classnames(styles.actionTag, styles[record.action])}>
                      {actionText[record.action]}
                    </View>
                  </View>
                )}

                {record.doctorNotes && record.type === 'followup' && (
                  <View className={styles.noteBox}>
                    <Text className={styles.noteLabel}>医生备注：</Text>
                    <Text className={styles.noteText}>{record.doctorNotes}</Text>
                  </View>
                )}

                {record.photos && record.photos.length > 0 && (
                  <View className={styles.photos}>
                    {record.photos.map((photo, index) => (
                      <View key={index} className={styles.photo}>
                        <Image
                          className={styles.photoImg}
                          src={photo}
                          mode="aspectFill"
                          onError={(e) => console.error('[Timeline] Image load error:', e)}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {record.type === 'pendingFollowup' && patientId && (
                  <View className={styles.pendingFooter}>
                    <Text className={styles.pendingHint}>
                      {isPendingOverdue
                        ? '逾期未处理，请尽快跟进'
                        : isPendingToday
                          ? '今日需处理，点击可直接处理'
                          : '点击卡片进入处理'}
                    </Text>
                    <View className={styles.pendingBtn}>
                      {isPendingOverdue ? '立即处理' : '查看详情'} ›
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default Timeline;
