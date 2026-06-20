import React, { useState } from 'react';
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useAppContext } from '@/store/AppContext';
import type { Patient } from '@/types';
import { formatDate } from '@/utils/date';

const AddPatientPage: React.FC = () => {
  const { addPatient } = useAppContext();

  const [form, setForm] = useState({
    name: '',
    gender: '男' as '男' | '女',
    age: '',
    phone: '',
    surgeryDate: formatDate(new Date().toISOString()),
    implantCount: '',
    implantPosition: '',
    hasBoneGraft: false,
    isImmediateLoading: false,
    notes: ''
  });

  useDidShow(() => {
    console.log('[AddPatient] Page shown');
  });

  const canSubmit = form.name && form.age && form.phone && form.implantCount && form.implantPosition;

  const handleInput = (field: keyof typeof form, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const implantCountNum = parseInt(form.implantCount);
    if (isNaN(implantCountNum) || implantCountNum <= 0) {
      Taro.showToast({ title: '请输入有效的种植颗数', icon: 'none' });
      return;
    }

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      Taro.showToast({ title: '请输入有效的年龄', icon: 'none' });
      return;
    }

    const patientData: Omit<Patient, 'id' | 'createdAt'> = {
      name: form.name,
      gender: form.gender,
      age: ageNum,
      phone: form.phone,
      surgeryDate: form.surgeryDate,
      implantCount: implantCountNum,
      implantPosition: form.implantPosition,
      hasBoneGraft: form.hasBoneGraft,
      isImmediateLoading: form.isImmediateLoading,
      notes: form.notes || undefined,
      status: 'normal',
      followupCount: 0
    };

    addPatient(patientData);

    console.log('[AddPatient] Created patient:', form.name);

    Taro.showToast({
      title: '患者档案已创建',
      icon: 'success'
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>基本信息</Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>患者姓名
            </Text>
            <Input
              className={styles.input}
              placeholder="请输入患者姓名"
              value={form.name}
              onInput={(e) => handleInput('name', e.detail.value)}
              maxlength={20}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>性别
            </Text>
            <View className={styles.genderSelector}>
              <Button
                className={classnames(styles.genderBtn, form.gender === '男' && styles.active)}
                onClick={() => handleInput('gender', '男')}
              >
                男
              </Button>
              <Button
                className={classnames(styles.genderBtn, form.gender === '女' && styles.active)}
                onClick={() => handleInput('gender', '女')}
              >
                女
              </Button>
            </View>
          </View>

          <View className={styles.inputRow}>
            <View className={styles.inputWrapper}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>年龄
              </Text>
              <Input
                className={styles.input}
                type="number"
                placeholder="年龄"
                value={form.age}
                onInput={(e) => handleInput('age', e.detail.value)}
                maxlength={3}
              />
            </View>
            <View className={styles.inputWrapper}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>联系电话
              </Text>
              <Input
                className={styles.input}
                type="number"
                placeholder="手机号"
                value={form.phone}
                onInput={(e) => handleInput('phone', e.detail.value)}
                maxlength={11}
              />
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>手术信息</Text>
        <View className={styles.formCard}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>手术日期
            </Text>
            <Input
              className={styles.input}
              type="digit"
              placeholder="YYYY-MM-DD"
              value={form.surgeryDate}
              onInput={(e) => handleInput('surgeryDate', e.detail.value)}
            />
            <Text className={styles.tip}>格式：年-月-日，如 2026-06-20</Text>
          </View>

          <View className={styles.inputRow}>
            <View className={styles.inputWrapper}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>种植颗数
              </Text>
              <Input
                className={styles.input}
                type="number"
                placeholder="颗数"
                value={form.implantCount}
                onInput={(e) => handleInput('implantCount', e.detail.value)}
                maxlength={2}
              />
            </View>
            <View className={styles.inputWrapper}>
              <Text className={styles.formLabel}>
                <Text className={styles.required}>*</Text>植体位置
              </Text>
              <Input
                className={styles.input}
                placeholder="如：左上456"
                value={form.implantPosition}
                onInput={(e) => handleInput('implantPosition', e.detail.value)}
                maxlength={20}
              />
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>附加选项</Text>
            <View className={styles.checkboxRow}>
              <Button
                className={classnames(styles.checkboxItem, form.hasBoneGraft && styles.active)}
                onClick={() => handleInput('hasBoneGraft', !form.hasBoneGraft)}
              >
                <View className={classnames(styles.checkboxIcon, form.hasBoneGraft && styles.checked)}></View>
                <Text>植骨</Text>
              </Button>
              <Button
                className={classnames(styles.checkboxItem, form.isImmediateLoading && styles.active)}
                onClick={() => handleInput('isImmediateLoading', !form.isImmediateLoading)}
              >
                <View className={classnames(styles.checkboxIcon, form.isImmediateLoading && styles.checked)}></View>
                <Text>即刻负重</Text>
              </Button>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>备注说明</Text>
            <Textarea
              className={styles.textarea}
              placeholder="输入患者特殊情况或注意事项（可选）"
              value={form.notes}
              onInput={(e) => handleInput('notes', e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          创建患者档案
        </Button>
      </View>
    </View>
  );
};

export default AddPatientPage;
