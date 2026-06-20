import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusBadgeProps {
  type?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'high' | 'medium' | 'low';
  showDot?: boolean;
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  type = 'primary', 
  showDot = false, 
  children 
}) => {
  return (
    <View className={classnames(
      styles.badge, 
      styles[type],
      showDot && styles.dot
    )}>
      <Text>{children}</Text>
    </View>
  );
};

export default StatusBadge;
