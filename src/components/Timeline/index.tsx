import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { TimelineRecord } from '@/types';
import { formatDateCN } from '@/utils/date';

interface TimelineProps {
  records: TimelineRecord[];
}

const actionText: Record<string, string> = {
  call: '医生电话回访',
  nurse: '护士代办',
  revisit: '建议复诊'
};

const typeText: Record<string, string> = {
  surgery: '手术',
  followup: '回访',
  note: '备注'
};

const Timeline: React.FC<TimelineProps> = ({ records }) => {
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isHighValue = (obs: { value?: number }) => {
    if (obs.value === undefined) return false;
    return obs.value >= 5;
  };

  return (
    <View className={styles.timeline}>
      {sortedRecords.map((record) => (
        <View key={record.id} className={styles.item}>
          <View className={classnames(
            styles.node,
            record.isAbnormal ? styles.abnormal : record.type === 'surgery' ? styles.surgery : styles.normal
          )}>
            <View className={styles.dot}></View>
          </View>

          <View className={styles.content}>
            <View className={styles.header}>
              <Text className={styles.date}>{formatDateCN(record.date)}</Text>
              <View className={classnames(styles.typeTag, styles[record.type])}>
                {typeText[record.type]}
              </View>
            </View>

            <View className={styles.title}>
              {record.title}
              {record.isAbnormal && (
                <Text className={styles.abnormalBadge}>异常</Text>
              )}
            </View>

            <View className={styles.description}>{record.description}</View>

            {record.action && (
              <View className={styles.actionRow}>
                <View className={classnames(styles.actionTag, styles[record.action])}>
                  {actionText[record.action]}
                </View>
              </View>
            )}

            {record.observations && record.observations.length > 0 && (
              <View className={styles.observations}>
                {record.observations.map((obs, index) => (
                  <View 
                    key={index} 
                    className={classnames(styles.obsItem, isHighValue(obs) && styles.high)}
                  >
                    <Text>{obs.name}</Text>
                    {obs.value !== undefined && (
                      <Text className={styles.value}>{obs.value}分</Text>
                    )}
                  </View>
                ))}
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
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
