import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Patient, FollowupTask } from '@/types';
import { getDaysAfterSurgery, isToday } from '@/utils/date';

interface PatientCardProps {
  patient: Patient;
  todayFollowup?: FollowupTask;
  onClick?: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, todayFollowup, onClick }) => {
  const daysAfterSurgery = getDaysAfterSurgery(patient.surgeryDate);

  const statusText = {
    normal: '恢复中',
    abnormal: '需关注',
    recovered: '已康复'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/patient-detail/index?id=${patient.id}`
      });
    }
  };

  const handleTodayFollowup = (e: any) => {
    e.stopPropagation();
    if (todayFollowup) {
      Taro.navigateTo({
        url: `/pages/followup-detail/index?id=${todayFollowup.id}&patientId=${patient.id}`
      });
    }
  };

  return (
    <View className={classnames(styles.card, todayFollowup && styles.todayCard)} onClick={handleClick}>
      {todayFollowup && (
        <View className={styles.todayBanner} onClick={handleTodayFollowup}>
          <View className={styles.todayBannerLeft}>
            <Text className={styles.todayBannerDot}>●</Text>
            <Text className={styles.todayBannerText}>今日回访待处理</Text>
            {todayFollowup.isAbnormal && (
              <Text className={styles.todayAbnormalTag}>异常</Text>
            )}
          </View>
          <Text className={styles.todayBannerAction}>立即处理 ›</Text>
        </View>
      )}

      <View className={styles.header}>
        <View className={styles.patientInfo}>
          <View className={styles.avatar}>
            {patient.name.charAt(0)}
          </View>
          <View>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{patient.name}</Text>
              <Text className={styles.genderAge}>{patient.gender} · {patient.age}岁</Text>
            </View>
            <Text className={styles.basicInfo}>{patient.phone}</Text>
          </View>
        </View>
        <View className={classnames(styles.statusBadge, styles[patient.status])}>
          {statusText[patient.status]}
        </View>
      </View>

      <View className={styles.surgeryInfo}>
        <View className={styles.surgeryRow}>
          <View className={styles.surgeryItem}>
            <Text className={styles.itemLabel}>种植：</Text>
            <Text className={styles.itemValue}>{patient.implantCount}颗</Text>
          </View>
          <View className={styles.surgeryItem}>
            <Text className={styles.itemLabel}>位置：</Text>
            <Text className={styles.itemValue}>{patient.implantPosition}</Text>
          </View>
        </View>
        <View className={styles.surgeryRow}>
          {patient.hasBoneGraft && (
            <View className={styles.tag}>植骨</View>
          )}
          {patient.isImmediateLoading && (
            <View className={styles.tag}>即刻负重</View>
          )}
          {patient.notes && (
            <Text className={styles.itemLabel}>{patient.notes}</Text>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.daysInfo}>
          术后 <Text className={styles.daysNum}>{daysAfterSurgery}</Text> 天
          <Text className={styles.followupCount}> · 已回访 {patient.followupCount} 次</Text>
        </View>
        {todayFollowup ? (
          <View className={styles.todayFollowupTag} onClick={handleTodayFollowup}>
            今日回访
          </View>
        ) : patient.nextFollowupDate && (
          <View className={styles.nextFollowup}>
            下次回访：
            <Text className={classnames(styles.date, isToday(patient.nextFollowupDate) && styles.todayDate)}>
              {isToday(patient.nextFollowupDate) ? '今天' : patient.nextFollowupDate}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default PatientCard;