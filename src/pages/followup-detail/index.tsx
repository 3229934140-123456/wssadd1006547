import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext } from '@/store/AppContext';
import { getFollowupById } from '@/data/mockFollowups';
import type { DoctorAction, FollowupTask } from '@/types';
import { formatDateCN, isToday } from '@/utils/date';

const actionOptions: { type: DoctorAction; name: string; desc: string; icon: string }[] = [
  { type: 'call', name: '亲自电话回访', desc: '医生直接与患者电话沟通', icon: '📞' },
  { type: 'nurse', name: '护士代办', desc: '分配给护士完成常规回访', icon: '👩‍⚕️' },
  { type: 'revisit', name: '建议复诊', desc: '通知患者来院复查', icon: '🏥' }
];

const FollowupDetailPage: React.FC = () => {
  const router = useRouter();
  const { updateFollowupTask, updatePatient, patients } = useAppContext();

  const followupId = router.params.id as string;
  const patientId = router.params.patientId as string;

  const [followup, setFollowup] = useState<FollowupTask | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<DoctorAction | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

  useDidShow(() => {
    if (followupId) {
      const task = getFollowupById(followupId);
      setFollowup(task);
      console.log('[FollowupDetail] Loaded followup:', followupId, 'patient:', patient?.name);
    }
  });

  if (!followup || !patient) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>回访任务不存在</Text>
        </View>
      </View>
    );
  }

  const canSubmit = selectedAction !== null;

  const handleSubmit = () => {
    if (!selectedAction) return;

    updateFollowupTask(followupId, {
      status: 'completed',
      doctorAction: selectedAction,
      doctorNotes,
      completedAt: new Date().toISOString().split('T')[0]
    });

    const hasAbnormal = followup.observations.some(o => (o.value || 0) >= 5);
    updatePatient(patientId, {
      status: hasAbnormal ? 'abnormal' : 'normal',
      followupCount: patient.followupCount + 1
    });

    console.log('[FollowupDetail] Completed followup for:', followup.patientName, 'action:', selectedAction);

    Taro.showToast({
      title: '回访处理完成',
      icon: 'success'
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  const handleCallPatient = () => {
    Taro.makePhoneCall({
      phoneNumber: patient.phone.replace(/\*/g, '0'),
      fail: (e) => console.error('[FollowupDetail] Call failed:', e)
    });
  };

  return (
    <View className={styles.page}>
      {followup.isAbnormal && (
        <View className={styles.alertBanner}>
          <View className={styles.alertIcon}>⚠️</View>
          <Text className={styles.alertText}>患者反馈异常，请注意重点关注</Text>
        </View>
      )}

      <View className={styles.patientCard} onClick={handleCallPatient}>
        <View className={styles.avatar}>{followup.patientName.charAt(0)}</View>
        <View className={styles.patientInfo}>
          <Text className={styles.patientName}>{followup.patientName}</Text>
          <Text className={styles.patientMeta}>
            {patient.gender} · {patient.age}岁 · {patient.phone}
          </Text>
        </View>
        <Text style={{ color: '#0F766E', fontSize: 24 }}>📞</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>观察项评分</Text>
        <View className={styles.observationsCard}>
          <View className={styles.obsList}>
            {followup.observations.map((obs, index) => {
              const isAbnormal = (obs.value || 0) >= 5;
              return (
                <View 
                  key={index} 
                  className={classnames(styles.obsItem, isAbnormal && styles.abnormal)}
                >
                  <Text className={styles.obsName}>{obs.name}</Text>
                  <View className={styles.obsScore}>
                    {obs.value !== undefined ? (
                      <>
                        <Text className={classnames(styles.scoreValue, isAbnormal && styles.high)}>
                          {obs.value}
                        </Text>
                        <Text className={styles.scoreLabel}>分</Text>
                      </>
                    ) : (
                      <Text className={styles.scoreLabel}>待患者填写</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {(followup.patientSymptoms || followup.patientPhotos) && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>患者反馈</Text>
          <View className={styles.symptomsCard}>
            {followup.patientSymptoms && (
              <>
                <Text className={styles.symptomsTitle}>症状描述</Text>
                <Text className={styles.symptomsText}>{followup.patientSymptoms}</Text>
              </>
            )}
            {followup.patientPhotos && followup.patientPhotos.length > 0 && (
              <View className={styles.photosSection}>
                <Text className={styles.symptomsTitle} style={{ marginBottom: 16 }}>患者照片</Text>
                <View className={styles.photosRow}>
                  {followup.patientPhotos.map((photo, index) => (
                    <View key={index} className={styles.photoItem}>
                      <Image 
                        className={styles.photoImg} 
                        src={photo} 
                        mode="aspectFill"
                        onError={(e) => console.error('[FollowupDetail] Image load error:', e)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      <View className={styles.actionSection}>
        <Text className={styles.sectionTitle}>处理方式</Text>
        <View className={styles.actionCard}>
          <View className={styles.actionOptions}>
            {actionOptions.map((option) => (
              <View
                key={option.type}
                className={classnames(
                  styles.actionOption,
                  selectedAction === option.type && styles.selected
                )}
                onClick={() => setSelectedAction(option.type)}
              >
                <View className={classnames(styles.actionIcon, styles[option.type])}>
                  {option.icon}
                </View>
                <View className={styles.actionInfo}>
                  <Text className={styles.actionName}>{option.name}</Text>
                  <Text className={styles.actionDesc}>{option.desc}</Text>
                </View>
                <View className={classnames(
                  styles.checkbox,
                  selectedAction === option.type && styles.selected
                )}></View>
              </View>
            ))}
          </View>

          <View className={styles.notesInput}>
            <Textarea
              className={styles.textarea}
              placeholder="输入处理备注（可选）"
              value={doctorNotes}
              onInput={(e) => setDoctorNotes(e.detail.value)}
              maxlength={300}
            />
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Text className={styles.dateInfo}>
          回访日期：{isToday(followup.scheduledDate) ? '今天' : formatDateCN(followup.scheduledDate)}
        </Text>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          确认处理
        </Button>
      </View>
    </View>
  );
};

export default FollowupDetailPage;
