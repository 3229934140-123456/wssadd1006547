import type { FollowupTask, TimelineRecord, TodoItem } from '@/types';

export const mockTimelines: Record<string, TimelineRecord[]> = {
  '1': [
    {
      id: 't1-4',
      date: '2026-06-20',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀、伤口渗血',
      description: '观察项：疼痛评分、面部肿胀、伤口渗血，患者已反馈异常',
      isAbnormal: true,
      followupId: 'f1'
    },
    {
      id: 't1-1',
      date: '2026-06-15',
      type: 'surgery',
      title: '种植手术完成',
      description: '左上456种植体植入，植骨，非即刻负重',
      isAbnormal: false
    },
    {
      id: 't1-2',
      date: '2026-06-18',
      type: 'followup',
      title: '术后3天回访',
      description: '患者诉疼痛评分4分，面部轻微肿胀，已指导冰敷',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 4 },
        { type: 'swelling', name: '面部肿胀', value: 2 }
      ]
    },
    {
      id: 't1-3',
      date: '2026-06-20',
      type: 'followup',
      title: '术后5天回访',
      description: '患者反馈疼痛加剧，评分7分，伤口有渗血，建议复诊检查',
      isAbnormal: true,
      action: 'revisit',
      photos: ['https://picsum.photos/id/237/300/300'],
      observations: [
        { type: 'pain', name: '疼痛评分', value: 7 },
        { type: 'bleeding', name: '伤口渗血', value: 3 },
        { type: 'swelling', name: '面部肿胀', value: 3 }
      ]
    }
  ],
  '2': [
    {
      id: 't2-3',
      date: '2026-06-20',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、咬合不适、面部肿胀',
      description: '观察项：疼痛评分、咬合不适、面部肿胀，待患者填写',
      isAbnormal: false,
      followupId: 'f2'
    },
    {
      id: 't2-1',
      date: '2026-06-18',
      type: 'surgery',
      title: '种植手术完成',
      description: '右下6种植体植入，即刻负重',
      isAbnormal: false
    },
    {
      id: 't2-2',
      date: '2026-06-19',
      type: 'followup',
      title: '术后1天回访',
      description: '患者无明显不适，咬合正常，护士已完成常规回访',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 2 },
        { type: 'occlusion', name: '咬合不适', value: 1 }
      ]
    }
  ],
  '3': [
    {
      id: 't3-4',
      date: '2026-06-18',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀',
      description: '观察项：疼痛评分、面部肿胀，回访已逾期',
      isAbnormal: false,
      followupId: 'f5'
    },
    {
      id: 't3-1',
      date: '2026-06-10',
      type: 'surgery',
      title: '种植手术完成',
      description: '左下45种植体植入，植骨',
      isAbnormal: false
    },
    {
      id: 't3-2',
      date: '2026-06-13',
      type: 'followup',
      title: '术后3天回访',
      description: '恢复良好，轻微疼痛，无肿胀',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 2 }
      ]
    },
    {
      id: 't3-3',
      date: '2026-06-17',
      type: 'followup',
      title: '拆线前回访',
      description: '伤口愈合良好，无红肿渗出',
      isAbnormal: false,
      action: 'nurse'
    }
  ],
  '4': [
    {
      id: 't4-4',
      date: '2026-06-20',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀、咬合不适',
      description: '观察项：疼痛评分、面部肿胀、咬合不适，患者反馈异常',
      isAbnormal: true,
      followupId: 'f3'
    },
    {
      id: 't4-1',
      date: '2026-06-12',
      type: 'surgery',
      title: '种植手术完成',
      description: '全口多颗种植，植骨量大',
      isAbnormal: false
    },
    {
      id: 't4-2',
      date: '2026-06-15',
      type: 'followup',
      title: '术后3天回访',
      description: '面部明显肿胀，疼痛评分6分，已电话指导用药',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 6 },
        { type: 'swelling', name: '面部肿胀', value: 3 }
      ]
    },
    {
      id: 't4-3',
      date: '2026-06-18',
      type: 'followup',
      title: '术后6天回访',
      description: '肿胀未消退，咬合不适加重，建议来院复查',
      isAbnormal: true,
      action: 'revisit',
      photos: ['https://picsum.photos/id/1062/300/300'],
      observations: [
        { type: 'swelling', name: '面部肿胀', value: 4 },
        { type: 'occlusion', name: '咬合不适', value: 3 },
        { type: 'pain', name: '疼痛评分', value: 5 }
      ]
    }
  ],
  '10': [
    {
      id: 't10-3',
      date: '2026-06-20',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀、伤口渗血',
      description: '观察项：疼痛评分、面部肿胀、伤口渗血，患者反馈异常',
      isAbnormal: true,
      followupId: 'f4'
    },
    {
      id: 't10-1',
      date: '2026-06-16',
      type: 'surgery',
      title: '种植手术完成',
      description: '右上567种植，植骨，非即刻负重',
      isAbnormal: false
    },
    {
      id: 't10-2',
      date: '2026-06-19',
      type: 'followup',
      title: '术后3天回访',
      description: '植骨区域仍有疼痛，护士已记录并上报医生',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 5 },
        { type: 'swelling', name: '面部肿胀', value: 2 }
      ]
    }
  ],
  '8': [
    {
      id: 't8-3',
      date: '2026-06-22',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀',
      description: '观察项：疼痛评分、面部肿胀，待回访日处理',
      isAbnormal: false,
      followupId: 'f6'
    },
    {
      id: 't8-1',
      date: '2026-06-19',
      type: 'surgery',
      title: '种植手术完成',
      description: '左下7种植，非即刻负重，未植骨',
      isAbnormal: false
    },
    {
      id: 't8-2',
      date: '2026-06-20',
      type: 'followup',
      title: '术后1天回访',
      description: '无明显不适，护士电话回访完成',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 1 }
      ]
    }
  ]
};

export const mockFollowupTasks: FollowupTask[] = [
  {
    id: 'f1',
    patientId: '1',
    patientName: '张明华',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: true,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 7 },
      { type: 'swelling', name: '面部肿胀', value: 3 },
      { type: 'bleeding', name: '伤口渗血', value: 3 }
    ],
    patientPhotos: ['https://picsum.photos/id/237/300/300'],
    patientSymptoms: '今天开始疼痛加剧，伤口有少量渗血，肿胀没有明显消退',
    createdAt: '2026-06-20'
  },
  {
    id: 'f2',
    patientId: '2',
    patientName: '李秀英',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分' },
      { type: 'occlusion', name: '咬合不适' },
      { type: 'swelling', name: '面部肿胀' }
    ],
    createdAt: '2026-06-18'
  },
  {
    id: 'f3',
    patientId: '4',
    patientName: '陈美玲',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: true,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 5 },
      { type: 'swelling', name: '面部肿胀', value: 4 },
      { type: 'occlusion', name: '咬合不适', value: 3 }
    ],
    patientPhotos: ['https://picsum.photos/id/1062/300/300'],
    patientSymptoms: '脸还是很肿，吃东西的时候感觉不太舒服',
    createdAt: '2026-06-18'
  },
  {
    id: 'f4',
    patientId: '10',
    patientName: '郑晓燕',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: true,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 6 },
      { type: 'swelling', name: '面部肿胀', value: 2 },
      { type: 'bleeding', name: '伤口渗血', value: 2 }
    ],
    patientSymptoms: '植骨的地方还是有点疼，早上刷牙有少量血丝',
    createdAt: '2026-06-20'
  },
  {
    id: 'f5',
    patientId: '3',
    patientName: '王建国',
    scheduledDate: '2026-06-18',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 3 },
      { type: 'swelling', name: '面部肿胀', value: 1 }
    ],
    patientSymptoms: '伤口有些发痒，其他还好',
    createdAt: '2026-06-10'
  },
  {
    id: 'f6',
    patientId: '8',
    patientName: '周小芳',
    scheduledDate: '2026-06-22',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分' },
      { type: 'swelling', name: '面部肿胀' }
    ],
    createdAt: '2026-06-19'
  }
];

export const mockTodoItems: TodoItem[] = [
  {
    id: 'todo1',
    patientId: '1',
    patientName: '张明华',
    type: 'abnormal',
    title: '伤口渗血需关注',
    description: '患者反馈疼痛加剧，评分7分，伤口有渗血',
    priority: 'high',
    scheduledDate: '2026-06-20',
    isRead: false
  },
  {
    id: 'todo2',
    patientId: '4',
    patientName: '陈美玲',
    type: 'abnormal',
    title: '肿胀未消退',
    description: '面部仍明显肿胀，咬合不适加重，疼痛5分',
    priority: 'high',
    scheduledDate: '2026-06-20',
    isRead: false
  },
  {
    id: 'todo3',
    patientId: '10',
    patientName: '郑晓燕',
    type: 'abnormal',
    title: '植骨区疼痛',
    description: '植骨区域疼痛，刷牙有少量血丝，疼痛6分',
    priority: 'medium',
    scheduledDate: '2026-06-20',
    isRead: true
  },
  {
    id: 'todo4',
    patientId: '2',
    patientName: '李秀英',
    type: 'pending',
    title: '术后2天常规回访',
    description: '即刻负重患者，需确认咬合情况',
    priority: 'low',
    scheduledDate: '2026-06-20',
    isRead: true
  },
  {
    id: 'todo5',
    patientId: '3',
    patientName: '王建国',
    type: 'urgent',
    title: '逾期回访 - 术后8天',
    description: '回访已逾期2天，请尽快处理',
    priority: 'high',
    scheduledDate: '2026-06-18',
    isRead: false
  },
  {
    id: 'todo6',
    patientId: '8',
    patientName: '周小芳',
    type: 'pending',
    title: '术后3天常规回访',
    description: '左下7种植，需确认疼痛和肿胀情况',
    priority: 'low',
    scheduledDate: '2026-06-22',
    isRead: true
  }
];

export const getTimelineByPatientId = (patientId: string): TimelineRecord[] => {
  return mockTimelines[patientId] || [];
};

export const getFollowupById = (id: string): FollowupTask | undefined => {
  return mockFollowupTasks.find(f => f.id === id);
};

export const getFollowupsByPatientId = (patientId: string): FollowupTask[] => {
  return mockFollowupTasks.filter(f => f.patientId === patientId);
};
