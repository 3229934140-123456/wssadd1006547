import React, { useState, useMemo } from 'react';
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ObservationItem from '@/components/ObservationItem';
import { useAppContext } from '@/store/AppContext';
import type { ObservationType, ObservationItem as ObservationItemType } from '@/types';
import { formatDate, formatDateCN } from '@/utils/date';

const observationOptions: { type: ObservationType; name: string; description: string }[] = [
  { type: 'pain', name: '疼痛评分', description: '1-10分，1分最轻，10分最严重' },
  { type: 'swelling', name: '面部肿胀', description: '观察患者面部肿胀情况' },
  { type: 'occlusion', name: '咬合不适', description: '检查咬合是否正常' },
  { type: 'bleeding', name: '伤口渗血', description: '观察伤口是否有渗血' }
];

const quickDateOptions = [
  { label: '术后当天', days: 0 },
  { label: '术后3天', days: 3 },
  { label: '术后7天', days: 7 },
  { label: '术后14天', days: 14 },
  { label: '术后1个月', days: 30 }
];

const AddFollowupPage: React.FC = () => {
  const router = useRouter();
  const { addFollowupTask, updatePatient, patients } = useAppContext();

  const patientId = router.params.patientId as string;
  const patientName = decodeURIComponent(router.params.patientName || '');

  const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

  const [selectedObservations, setSelectedObservations] = useState<Map<ObservationType, number>>(new Map());
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow.toISOString());
  });
  const [notes, setNotes] = useState('');

  useDidShow(() => {
    console.log('[AddFollowup] Creating followup for patient:', patientName);
  });

  const handleObservationToggle = (type: ObservationType) => {
    setSelectedObservations(prev => {
      const newMap = new Map(prev);
      if (newMap.has(type)) {
        newMap.delete(type);
      } else {
        newMap.set(type, 0);
      }
      return newMap;
    });
  };

  const handleScoreChange = (type: ObservationType, score: number) => {
    setSelectedObservations(prev => {
      const newMap = new Map(prev);
      newMap.set(type, score);
      return newMap;
    });
  };

  const handleQuickDate = (days: number) => {
    if (patient) {
      const newDate = new Date(patient.surgeryDate);
      newDate.setDate(newDate.getDate() + days);
      setScheduledDate(formatDate(newDate.toISOString()));
    }
  };

  const handleDateChange = (e: any) => {
    setScheduledDate(e.detail.value);
  };

  const canSubmit = selectedObservations.size > 0;

  const handleSubmit = () => {
    if (!canSubmit || !patientId) return;

    const observations: ObservationItemType[] = Array.from(selectedObservations.entries()).map(
      ([type, value]) => {
        const option = observationOptions.find(o => o.type === type)!;
        return {
          type,
          name: option.name,
          value: value > 0 ? value : undefined
        };
      }
    );

    const isAbnormal = Array.from(selectedObservations.values()).some(v => v >= 5);

    addFollowupTask({
      patientId,
      patientName,
      scheduledDate,
      status: 'pending',
      observations,
      isAbnormal,
      doctorNotes: notes
    });

    updatePatient(patientId, {
      nextFollowupDate: scheduledDate,
      status: isAbnormal ? 'abnormal' : patient.status
    });

    console.log('[AddFollowup] Created followup task for:', patientName, 'date:', scheduledDate);

    Taro.showToast({
      title: '回访任务已创建',
      icon: 'success'
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  return (
    <View className={styles.page}>
      {patientName && (
        <View className={styles.patientInfo}>
          <View className={styles.avatar}>{patientName.charAt(0)}</View>
          <View>
            <Text className={styles.name}>{patientName}</Text>
            <Text className={styles.subInfo}>
              {patient ? `术后 ${getDaysDiff(patient.surgeryDate)} 天` : '创建回访任务'}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>回访日期</Text>
        {patient && (
          <View className={styles.quickDateRow}>
            {quickDateOptions.map((option, index) => (
              <Button
                key={index}
                className={classnames(styles.quickDateBtn, getQuickDateActive(patient.surgeryDate, option.days, scheduledDate) && styles.active)}
                onClick={() => handleQuickDate(option.days)}
              >
                {option.label}
              </Button>
            ))}
          </View>
        )}
        <View className={styles.dateSelector} onClick={() => {
          Taro.showActionSheet({
            itemList: quickDateOptions.map(o => o.label).concat(['自定义日期']),
            success: (res) => {
              if (res.tapIndex < quickDateOptions.length) {
                handleQuickDate(quickDateOptions[res.tapIndex].days);
              }
            }
          });
        }}>
          <Text className={styles.dateLabel}>选择回访日期</Text>
          <Text className={styles.dateValue}>{formatDateCN(scheduledDate)}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>观察项目</Text>
        <Text className={styles.sectionSubtitle}>选择需要关注的观察项</Text>
        <View className={styles.observationList}>
          {observationOptions.map((option) => (
            <ObservationItem
              key={option.type}
              type={option.type}
              name={option.name}
              description={option.description}
              selected={selectedObservations.has(option.type)}
              score={selectedObservations.get(option.type)}
              showScore={true}
              onSelect={() => handleObservationToggle(option.type)}
              onScoreChange={(score) => handleScoreChange(option.type, score)}
            />
          ))}
        </View>
        <Text className={styles.selectedCount}>
          已选择 {selectedObservations.size} 项观察内容
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>备注说明</Text>
        <View className={styles.notesInput}>
          <Textarea
            className={styles.textarea}
            placeholder="输入医生备注说明（可选）"
            value={notes}
            onInput={(e) => setNotes(e.detail.value)}
            maxlength={500}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          创建回访任务
        </Button>
      </View>
    </View>
  );

  function getDaysDiff(surgeryDate: string): number {
    const diff = Math.abs(new Date().getTime() - new Date(surgeryDate).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getQuickDateActive(surgeryDate: string, days: number, targetDate: string): boolean {
    const expected = new Date(surgeryDate);
    expected.setDate(expected.getDate() + days);
    return formatDate(expected.toISOString()) === targetDate;
  }
};

export default AddFollowupPage;
