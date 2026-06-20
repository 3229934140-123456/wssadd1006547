import React from 'react';
import { Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ActionButtonProps {
  type?: 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'outlineError';
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  type = 'primary',
  size = 'medium',
  block = false,
  disabled = false,
  onClick,
  children
}) => {
  return (
    <Button
      className={classnames(
        styles.button,
        styles[type],
        size === 'large' && styles.large,
        size === 'small' && styles.small,
        block && styles.block,
        disabled && styles.disabled
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default ActionButton;
