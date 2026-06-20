import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { AppProvider } from '@/store/AppContext';
// 全局样式
import './app.scss';

function App(props) {
  useEffect(() => {
    console.log('[App] App initialized');
  }, []);

  useDidShow(() => {
    console.log('[App] App shown');
  });

  useDidHide(() => {
    console.log('[App] App hidden');
  });

  return (
    <AppProvider>
      {props.children}
    </AppProvider>
  );
}

export default App;
