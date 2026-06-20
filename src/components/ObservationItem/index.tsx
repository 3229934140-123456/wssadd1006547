import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ObservationType } from '@/types';

interface ObservationItemProps {
  type: ObservationType;
  name: string;
  description?: string;
  selected?: boolean;
  score?: number;
  showScore?: boolean;
  abnormal?: boolean;
  onSelect?: () => void;
  onScoreChange?: (score: number) => void;
}

const ObservationItem: React.FC<ObservationItemProps> = ({
  name,
  description,
  selected = false,
  score,
  showScore = false,
  abnormal = false,
  onSelect,
  onScoreChange
}) => {
  const handleScoreClick = (value: number) => {
    if (onScoreChange) {
      onScoreChange(value);
    }
  };

  return (
    <View 
      className={classnames(
        styles.item, 
        selected && styles.selected,
        abnormal && styles.abnormal
      )}
      onClick={onSelect}
    >
      <View className={styles.header}>
        <Text className={styles.name}>{name}</Text>
        <View className={classnames(styles.checkbox, selected && styles.checked)}></View>
      </View>

      {description && (
        <Text className={styles.description}>{description}</Text>
      )}

      {showScore && selected && (
        <View className={styles.scoreSelector}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <View
              key={value}
              className={classnames(
                styles.scoreBtn,
                score === value && (value >= 5 ? styles.activeHigh : styles.active)
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleScoreClick(value);
              }}
            >
              <Text>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default ObservationItem;
