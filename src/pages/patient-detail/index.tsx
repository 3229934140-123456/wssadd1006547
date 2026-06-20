import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import Timeline from '@/components/Timeline';
import { useAppContext } from '@/store/AppContext';
import { getDaysAfterSurgery, formatDateCN, isToday, isOverdue, getDaysDiff } from '@/utils/date';
import type { FollowupPlanTemplate } from '@/types';

const statusText: Record<string, string> = {
  normal: '恢复中',
  abnormal: '需关注',
  recovered: '已康复'
};

const PatientDetailPage: React.FC = () => {
  const router = useRouter();
  const patientId = router.params.id as string;

  const {
    patients,
    getTimelineByPatientId,
    getFollowupsByPatientId,
    addFollowupPlanBatch,
    getFollowupPlanTemplates,
    completeRevisitReminder
  } = useAppContext();

  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);
  const templates = useMemo(() => getFollowupPlanTemplates(), [getFollowupPlanTemplates]);

  const timelineRecords = useMemo(() => {
    return getTimelineByPatientId(patientId);
  }, [getTimelineByPatientId, patientId]);

  const pendingFollowups = useMemo(() => {
    return getFollowupsByPatientId(patientId).filter(f => f.status === 'pending');
  }, [getFollowupsByPatientId, patientId]);

  useDidShow(() => {
    console.log('[PatientDetail] Loaded patient:', patient?.name,
      'timeline:', timelineRecords.length,
      'pending followups:', pendingFollowups.length);
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

  const handleGeneratePlan = () => {
    setShowPlanPicker(true);
  };

  const handleSelectTemplate = async (template: FollowupPlanTemplate, templateIndex: number) => {
    Taro.showModal({
      title: '生成回访方案',
      content: `确认生成「${template.name}」？\n将为该患者创建 ${template.plans.length} 个回访计划`,
      success: (res) => {
        if (res.confirm) {
          const ids = addFollowupPlanBatch(patientId, templateIndex);
          setShowPlanPicker(false);
          Taro.showToast({
            title: `已生成${ids.length}个回访计划`,
            icon: 'success'
          });
        }
      }
    });
  };

  const handleFollowupClick = (followupId: string) => {
    Taro.navigateTo({
      url: `/pages/followup-detail/index?id=${followupId}&patientId=${patientId}`
    });
  };

  const handleCallPatient = () => {
    Taro.makePhoneCall({
      phoneNumber: patient.phone.replace(/\*/g, '0'),
      fail: (e) => console.error('[PatientDetail] Call failed:', e)
    });
  };

  const handleCompleteRevisit = () => {
    if (!patient.revisitReminder) return;
    Taro.showModal({
      title: '复诊完成',
      content: `确认患者已完成复诊？`,
      success: (res) => {
        if (res.confirm) {
          completeRevisitReminder(patientId);
          Taro.showToast({ title: '复诊已确认', icon: 'success' });
        }
      }
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
        </View>
        {patient.notes && (
          <View className={styles.notes}>
            <Text>备注：{patient.notes}</Text>
          </View>
        )}
      </View>

      {patient.revisitReminder && !patient.revisitReminder.completed && (
        <View className={styles.revisitBanner} onClick={handleCompleteRevisit}>
          <View className={styles.revisitIcon}>🏥</View>
          <View className={styles.revisitContent}>
            <Text className={styles.revisitTitle}>建议复诊提醒</Text>
            <Text className={styles.revisitDesc}>
              {patient.revisitReminder.reason || '请跟进'} · 计划日期：{formatDateCN(patient.revisitReminder.scheduledDate)}
              {isOverdue(patient.revisitReminder.scheduledDate) && (
                <Text className={styles.revisitOverdue}> （逾期{getDaysDiff(patient.revisitReminder.scheduledDate, new Date().toISOString().split('T')[0])}天）</Text>
              )}
            </Text>
          </View>
          <View className={styles.revisitAction}>确认完成 ›</View>
        </View>
      )}

      {pendingFollowups.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>待处理回访</Text>
          {pendingFollowups.map(followup => {
            const pendingOverdue = isOverdue(followup.scheduledDate);
            const overdueDays = pendingOverdue ? getDaysDiff(followup.scheduledDate, new Date().toISOString().split('T')[0]) : 0;
            return (
              <View
                key={followup.id}
                className={classnames(
                  styles.pendingCard,
                  isToday(followup.scheduledDate) && styles.todayPending,
                  pendingOverdue && styles.overduePending
                )}
                onClick={() => handleFollowupClick(followup.id)}
              >
                <View className={styles.pendingHeader}>
                  <View className={styles.pendingInfo}>
                    <Text className={classnames(
                      styles.pendingDate,
                      pendingOverdue && styles.overdueText
                    )}>
                      {pendingOverdue
                        ? `逾期${overdueDays}天`
                        : isToday(followup.scheduledDate)
                          ? '今日'
                          : formatDateCN(followup.scheduledDate)}回访
                    </Text>
                    {followup.isAbnormal && (
                      <View className={styles.abnormalTag}>异常</View>
                    )}
                    {isToday(followup.scheduledDate) && !pendingOverdue && (
                      <View className={styles.todayTag}>待处理</View>
                    )}
                    {pendingOverdue && (
                      <View className={styles.overdueTag}>立即处理</View>
                    )}
                  </View>
                  <Text className={styles.pendingArrow}>›</Text>
                </View>
                <View className={styles.pendingObs}>
                  {followup.observations.map((obs, i) => (
                    <Text key={i} className={classnames(
                      styles.obsTag,
                      (obs.value ?? 0) >= (obs.threshold ?? 5) && styles.highScoreObs
                    )}>
                      {obs.name}{obs.value ? ` ${obs.value}分` : ''}
                    </Text>
                  ))}
                </View>
                {followup.patientSymptoms && (
                  <Text className={styles.pendingSymptoms}>{followup.patientSymptoms}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>回访时间轴</Text>
          <View className={styles.btnGroup}>
            <Button className={styles.planBtn} onClick={handleGeneratePlan}>
              📋 一键生成方案
            </Button>
            <Button className={styles.addBtn} onClick={handleAddFollowup}>
              + 新增回访
            </Button>
          </View>
        </View>
        {timelineRecords.length > 0 ? (
          <Timeline records={timelineRecords} patientId={patientId} />
        ) : (
          <View className={styles.emptyTimeline}>
            暂无回访记录，点击上方按钮创建回访计划
          </View>
        )}
      </View>

      {showPlanPicker && (
        <View className={styles.modalMask} onClick={() => setShowPlanPicker(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation?.()}>
            <Text className={styles.modalTitle}>选择回访方案</Text>
            <Text className={styles.modalDesc}>将根据手术日期自动安排回访时间</Text>
            {templates.map((tpl, idx) => (
              <View key={idx} className={styles.templateItem} onClick={() => handleSelectTemplate(tpl, idx)}>
                <View className={styles.templateHeader}>
                  <Text className={styles.templateName}>{tpl.name}</Text>
                  <Text className={styles.templateCount}>{tpl.plans.length}个节点</Text>
                </View>
                <Text className={styles.templateDesc}>{tpl.description}</Text>
                <View className={styles.templatePlans}>
                  {tpl.plans.map((plan, pIdx) => (
                    <Text key={pIdx} className={styles.planChip}>
                      术后{plan.daysAfterSurgery}天
                    </Text>
                  ))}
                </View>
              </View>
            ))}
            <Button className={styles.modalCancel} onClick={() => setShowPlanPicker(false)}>
              取消
            </Button>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.bottomBtn, styles.outline)}
          onClick={handleCallPatient}
        >
          电话联系
        </Button>
        <Button
          className={classnames(styles.bottomBtn, styles.secondary)}
          onClick={handleGeneratePlan}
        >
          一键方案
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
