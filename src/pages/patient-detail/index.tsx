import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import Timeline from '@/components/Timeline';
import { useAppContext, getHighScoreObservations, HIGH_SCORE_THRESHOLD } from '@/store/AppContext';
import { getDaysAfterSurgery, formatDateCN, isToday, isOverdue, getDaysDiff, addDays } from '@/utils/date';
import type { FollowupPlanTemplate } from '@/types';

type RouteNodeType = 'surgery' | 'completed' | 'pending' | 'revisit' | 'revisitDone';
type RevisitAction = 'complete' | 'reschedule' | null;

interface RouteNode {
  id: string;
  type: RouteNodeType;
  title: string;
  date: string;
  followupId?: string;
  isActive: boolean;
  isPast: boolean;
  hasHighScore?: boolean;
}

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
    completeRevisitReminder,
    rescheduleRevisitReminder
  } = useAppContext();

  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showRevisitModal, setShowRevisitModal] = useState(false);
  const [revisitAction, setRevisitAction] = useState<RevisitAction>(null);
  const [revisitResult, setRevisitResult] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');

  const patient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);
  const templates = useMemo(() => getFollowupPlanTemplates(), [getFollowupPlanTemplates]);

  const timelineRecords = useMemo(() => {
    return getTimelineByPatientId(patientId);
  }, [getTimelineByPatientId, patientId]);

  const pendingFollowups = useMemo(() => {
    return getFollowupsByPatientId(patientId).filter(f => f.status === 'pending');
  }, [getFollowupsByPatientId, patientId]);

  const completedFollowups = useMemo(() => {
    return getFollowupsByPatientId(patientId).filter(f => f.status === 'completed');
  }, [getFollowupsByPatientId, patientId]);

  const nextFollowupDate = useMemo(() => {
    if (pendingFollowups.length === 0) return undefined;
    const sorted = [...pendingFollowups].sort((a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
    return sorted[0].scheduledDate;
  }, [pendingFollowups]);

  const followupRoute = useMemo((): RouteNode[] => {
    if (!patient) return [];
    const nodes: RouteNode[] = [];
    const today = new Date().toISOString().split('T')[0];

    nodes.push({
      id: 'surgery',
      type: 'surgery',
      title: '种植手术',
      date: patient.surgeryDate,
      isActive: false,
      isPast: patient.surgeryDate < today
    });

    const allFollowups = [...completedFollowups, ...pendingFollowups].sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    for (const f of allFollowups) {
      const isCompleted = f.status === 'completed';
      const isPast = f.scheduledDate < today && isCompleted;
      const isActive = f.scheduledDate >= today && !isCompleted;
      const hasHighScore = getHighScoreObservations(f.observations).length > 0;

      nodes.push({
        id: f.id,
        type: isCompleted ? 'completed' : 'pending',
        title: f.templateName
          ? `${f.templateName} · ${formatDateCN(f.scheduledDate).replace(/^\d{4}年/, '')}`
          : `术后${getDaysAfterSurgery(patient.surgeryDate, f.scheduledDate)}天回访`,
        date: f.scheduledDate,
        followupId: f.id,
        isActive,
        isPast,
        hasHighScore
      });
    }

    if (patient.revisitReminder && !patient.revisitReminder.completed) {
      nodes.push({
        id: 'revisit',
        type: 'revisit',
        title: '建议复诊',
        date: patient.revisitReminder.scheduledDate,
        isActive: true,
        isPast: patient.revisitReminder.scheduledDate < today
      });
    }

    if (patient.revisitReminder?.completed) {
      nodes.push({
        id: 'revisitDone',
        type: 'revisitDone',
        title: '已复诊',
        date: patient.revisitReminder.scheduledDate,
        isActive: false,
        isPast: true
      });
    }

    return nodes;
  }, [patient, completedFollowups, pendingFollowups]);

  useDidShow(() => {
    console.log('[PatientDetail] Loaded patient:', patient?.name,
      'timeline:', timelineRecords.length,
      'pending followups:', pendingFollowups.length,
      'nextFollowupDate:', nextFollowupDate);
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

  const openRevisitModal = useCallback(() => {
    setShowRevisitModal(true);
    setRevisitAction(null);
    setRevisitResult('');
    setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 3));
  }, []);

  const handleConfirmRevisitComplete = useCallback(() => {
    completeRevisitReminder(patientId, revisitResult.trim() || undefined);
    Taro.showToast({ title: '复诊已完成', icon: 'success' });
    setShowRevisitModal(false);
  }, [patientId, revisitResult, completeRevisitReminder]);

  const handleConfirmReschedule = useCallback(() => {
    if (!rescheduleDate) return;
    rescheduleRevisitReminder(patientId, rescheduleDate);
    Taro.showToast({ title: '改期成功', icon: 'success' });
    setShowRevisitModal(false);
  }, [patientId, rescheduleDate, rescheduleRevisitReminder]);

  const handleRouteNodeClick = (node: RouteNode) => {
    if (node.followupId && node.type === 'pending') {
      handleFollowupClick(node.followupId);
    } else if (node.followupId && node.type === 'completed') {
      handleFollowupClick(node.followupId);
    }
  };

  const getNodeIcon = (type: RouteNodeType) => {
    switch (type) {
      case 'surgery': return '🏥';
      case 'completed': return '✅';
      case 'pending': return '⏰';
      case 'revisit': return '💜';
      case 'revisitDone': return '💚';
      default: return '•';
    }
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
            <Text className={styles.infoLabel}>下次回访</Text>
            <Text className={classnames(
              styles.infoValue,
              nextFollowupDate && isOverdue(nextFollowupDate) && styles.overdueText
            )}>
              {nextFollowupDate ? formatDateCN(nextFollowupDate) : '暂无计划'}
            </Text>
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

      {followupRoute.length > 1 && (
        <View className={styles.routeSection}>
          <Text className={styles.sectionTitle}>长期随访路线</Text>
          <ScrollView className={styles.routeContainer} scrollX>
            <View className={styles.routeTrack}>
              {followupRoute.map((node, idx) => {
                const isLast = idx === followupRoute.length - 1;
                return (
                  <View key={node.id} className={styles.routeNodeWrapper}>
                    <View
                      className={classnames(
                        styles.routeNode,
                        node.isActive && styles.routeNodeActive,
                        node.isPast && styles.routeNodePast,
                        node.hasHighScore && styles.routeNodeHighScore,
                        node.type === 'revisit' && styles.routeNodeRevisit,
                        node.type === 'revisitDone' && styles.routeNodeRevisitDone
                      )}
                      onClick={() => handleRouteNodeClick(node)}
                    >
                      <Text className={styles.routeIcon}>{getNodeIcon(node.type)}</Text>
                      <Text className={styles.routeNodeTitle}>{node.title}</Text>
                      <Text className={styles.routeNodeDate}>
                        {isToday(node.date) ? '今日' : isOverdue(node.date) && !node.isPast ? `逾期${getDaysDiff(node.date, new Date().toISOString().split('T')[0])}天` : formatDateCN(node.date).replace(/^\d{4}年/, '')}
                      </Text>
                    </View>
                    {!isLast && (
                      <View className={classnames(
                        styles.routeConnector,
                        node.isPast && styles.routeConnectorPast
                      )} />
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {patient.revisitReminder && !patient.revisitReminder.completed && (
        <View className={styles.revisitBanner} onClick={openRevisitModal}>
          <View className={styles.revisitIcon}>🏥</View>
          <View className={styles.revisitContent}>
            <Text className={styles.revisitTitle}>建议复诊提醒</Text>
            <Text className={styles.revisitDesc}>
              {patient.revisitReminder.reason || '请跟进'} · 计划日期：{formatDateCN(patient.revisitReminder.scheduledDate)}
              {patient.revisitReminder.rescheduledCount && patient.revisitReminder.rescheduledCount > 0 && (
                <Text className={styles.revisitOverdue}> （已改期{patient.revisitReminder.rescheduledCount}次）</Text>
              )}
              {isOverdue(patient.revisitReminder.scheduledDate) && (
                <Text className={styles.revisitOverdue}> （逾期{getDaysDiff(patient.revisitReminder.scheduledDate, new Date().toISOString().split('T')[0])}天）</Text>
              )}
            </Text>
          </View>
          <View className={styles.revisitAction}>处理 ›</View>
        </View>
      )}

      {pendingFollowups.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>待处理回访</Text>
          {pendingFollowups.map(followup => {
            const pendingOverdue = isOverdue(followup.scheduledDate);
            const overdueDays = pendingOverdue ? getDaysDiff(followup.scheduledDate, new Date().toISOString().split('T')[0]) : 0;
            const highScoreObs = getHighScoreObservations(followup.observations);
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
                    {highScoreObs.length > 0 && (
                      <View className={styles.highScoreTag}>🔥 高分</View>
                    )}
                    {followup.isAbnormal && highScoreObs.length === 0 && (
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
                  {followup.observations.map((obs, i) => {
                    const isHigh = (obs.value ?? 0) > (obs.threshold ?? HIGH_SCORE_THRESHOLD);
                    return (
                      <Text key={i} className={classnames(
                        styles.obsTag,
                        isHigh && styles.highScoreObs
                      )}>
                        {obs.name}{obs.value ? ` ${obs.value}分` : ''}
                      </Text>
                    );
                  })}
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

      {showRevisitModal && patient.revisitReminder && (
        <View className={styles.modalMask} onClick={() => setShowRevisitModal(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <Text className={styles.modalTitle}>复诊提醒处理</Text>
            <Text className={styles.modalSubtitle}>
              {patient.name} · {formatDateCN(patient.revisitReminder.scheduledDate)}
            </Text>
            <Text className={styles.modalDesc}>{patient.revisitReminder.reason || '请跟进复诊情况'}</Text>

            {!revisitAction ? (
              <View className={styles.actionRow}>
                <Button className={classnames(styles.actionOptionBtn, styles.completeBtn)} onClick={() => setRevisitAction('complete')}>
                  ✅ 确认复诊完成
                </Button>
                <Button className={classnames(styles.actionOptionBtn, styles.rescheduleBtn)} onClick={() => setRevisitAction('reschedule')}>
                  📅 改约时间
                </Button>
                <Button className={styles.modalCancel} onClick={() => setShowRevisitModal(false)}>
                  取消
                </Button>
              </View>
            ) : revisitAction === 'complete' ? (
              <View className={styles.formRow}>
                <Text className={styles.formLabel}>复诊结论（可选）</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请填写复诊结果、处理方案等'
                  value={revisitResult}
                  onInput={e => setRevisitResult(e.detail.value)}
                />
                <View className={styles.formActions}>
                  <Button className={styles.formBack} onClick={() => setRevisitAction(null)}>返回</Button>
                  <Button className={styles.formConfirm} onClick={handleConfirmRevisitComplete}>
                    确认完成
                  </Button>
                </View>
              </View>
            ) : (
              <View className={styles.formRow}>
                <Text className={styles.formLabel}>新复诊日期</Text>
                <Input
                  className={styles.formInput}
                  placeholder='请输入新日期，格式：2026-06-25'
                  value={rescheduleDate}
                  onInput={e => setRescheduleDate(e.detail.value)}
                />
                <Text className={styles.formHint}>
                  快捷选择：
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 1))}>明天</Text>
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 3))}>3天后</Text>
                  <Text className={styles.quickDate} onClick={() => setRescheduleDate(addDays(new Date().toISOString().split('T')[0], 7))}>1周后</Text>
                </Text>
                <View className={styles.formActions}>
                  <Button className={styles.formBack} onClick={() => setRevisitAction(null)}>返回</Button>
                  <Button className={styles.formConfirm} onClick={handleConfirmReschedule}>
                    确认改期
                  </Button>
                </View>
              </View>
            )}
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
