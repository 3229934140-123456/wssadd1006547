import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import Timeline from '@/components/Timeline';
import { useAppContext } from '@/store/AppContext';
import { getTimelineByPatientId } from '@/data/mockFollowups';
import { getDaysAfterSurgery, formatDateCN } from '@/utils/date';
import type { Patient, TimelineRecord } from '@/types';

const statusText: Record<string, string> = {
  normal: '恢复中',
  abnormal: '需关注',
  recovered: '已康复'
};

const PatientDetailPage: React.FC = () => {
  const router = useRouter();
  const { patients } = useAppContext();
  const [timelineRecords, setTimelineRecords] = useState<TimelineRecord[]>([]);

  const patientId = router.params.id as string;

  const patient: Patient | undefined = useMemo(() => {
    return patients.find(p => p.id === patientId);
  }, [patients, patientId]);

  useDidShow(() => {
    if (patientId) {
      const records = getTimelineByPatientId(patientId);
      setTimelineRecords(records);
      console.log('[PatientDetail] Loaded patient:', patient?.name, 'timeline records:', records.length);
    }
  });

  if (!patient) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>患者不存在</Text>
        </View>
      </View>
    );
  }

  const daysAfterSurgery = getDaysAfterSurgery(patient.surgeryDate);

  const handleAddFollowup = () => {
    Taro.navigateTo({
      url: `/pages/add-followup/index?patientId=${patientId}&patientName=${encodeURIComponent(patient.name)}`
    });
  };

  const handleCallPatient = () => {
    Taro.makePhoneCall({
      phoneNumber: patient.phone.replace(/\*/g, '0'),
      fail: (e) => console.error('[PatientDetail] Call failed:', e)
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.basicInfo}>
          <View className={styles.avatar}>
            {patient.name.charAt(0)}
          </View>
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{patient.name}</Text>
              <Text className={styles.genderAge}>{patient.gender} · {patient.age}岁</Text>
            </View>
            <Text className={styles.phone}>{patient.phone}</Text>
            <View className={classnames(styles.statusBadge, styles[patient.status])}>
              {statusText[patient.status]}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.surgeryCard}>
        <Text className={styles.cardTitle}>手术信息</Text>
        <View className={styles.infoGrid}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>手术日期</Text>
            <Text className={styles.infoValue}>{formatDateCN(patient.surgeryDate)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>术后天数</Text>
            <Text className={styles.infoValue}>{daysAfterSurgery} 天</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>种植颗数</Text>
            <Text className={styles.infoValue}>{patient.implantCount} 颗</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>植体位置</Text>
            <Text className={styles.infoValue}>{patient.implantPosition}</Text>
          </View>
        </View>
        <View className={styles.tagsRow}>
          {patient.hasBoneGraft && (
            <View className={styles.tag}>植骨</View>
          )}
          {patient.isImmediateLoading && (
            <View className={styles.tag}>即刻负重</View>
          )}
          <View className={styles.tag}>已回访 {patient.followupCount} 次</View>
          {patient.nextFollowupDate && (
            <View className={styles.tag}>下次回访：{patient.nextFollowupDate}</View>
          )}
        </View>
        {patient.notes && (
          <View className={styles.notes}>
            <Text>📝 备注：{patient.notes}</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>回访时间轴</Text>
          <Button className={styles.addBtn} onClick={handleAddFollowup}>
            + 新增回访
          </Button>
        </View>
        {timelineRecords.length > 0 ? (
          <Timeline records={timelineRecords} />
        ) : (
          <View className={styles.emptyTimeline}>
            暂无回访记录，点击上方按钮创建回访计划
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button 
          className={classnames(styles.bottomBtn, styles.outline)}
          onClick={handleCallPatient}
        >
          电话联系
        </Button>
        <Button 
          className={classnames(styles.bottomBtn, styles.primary)}
          onClick={handleAddFollowup}
        >
          创建回访
        </Button>
      </View>
    </View>
  );
};

export default PatientDetailPage;
