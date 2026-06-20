import type { FollowupTask, TimelineRecord, TodoItem, FollowupPlanTemplate } from '@/types';

export const followupPlanTemplates: FollowupPlanTemplate[] = [
  {
    name: '标准术后回访方案',
    description: '种植术后1天、3天、7天、14天常规回访',
    plans: [
      {
        daysAfterSurgery: 1,
        name: '术后1天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 5 },
          { type: 'swelling', name: '面部肿胀', threshold: 4 }
        ]
      },
      {
        daysAfterSurgery: 3,
        name: '术后3天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 5 },
          { type: 'swelling', name: '面部肿胀', threshold: 4 },
          { type: 'bleeding', name: '伤口渗血', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 7,
        name: '术后7天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 4 },
          { type: 'swelling', name: '面部肿胀', threshold: 3 },
          { type: 'occlusion', name: '咬合不适', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 14,
        name: '术后14天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 3 },
          { type: 'occlusion', name: '咬合不适', threshold: 2 }
        ]
      }
    ]
  },
  {
    name: '植骨加强回访方案',
    description: '植骨患者需加密切口观察，术后1/2/3/7/14天回访',
    plans: [
      {
        daysAfterSurgery: 1,
        name: '术后1天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 5 },
          { type: 'swelling', name: '面部肿胀', threshold: 4 },
          { type: 'bleeding', name: '伤口渗血', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 2,
        name: '术后2天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 5 },
          { type: 'swelling', name: '面部肿胀', threshold: 4 },
          { type: 'bleeding', name: '伤口渗血', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 3,
        name: '术后3天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 5 },
          { type: 'swelling', name: '面部肿胀', threshold: 4 },
          { type: 'bleeding', name: '伤口渗血', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 7,
        name: '术后7天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 4 },
          { type: 'swelling', name: '面部肿胀', threshold: 3 },
          { type: 'occlusion', name: '咬合不适', threshold: 3 }
        ]
      },
      {
        daysAfterSurgery: 14,
        name: '术后14天回访',
        observations: [
          { type: 'pain', name: '疼痛评分', threshold: 3 },
          { type: 'occlusion', name: '咬合不适', threshold: 2 }
        ]
      }
    ]
  }
];

export const mockTimelines: Record<string, TimelineRecord[]> = {
  '1': [
    {
      id: 't1-4',
      date: '2026-06-20',
      type: 'pendingFollowup',
      title: '回访计划：疼痛评分、面部肿胀、伤口渗血',
      description: '观察项：疼痛评分、面部肿胀、伤口渗血，患者已反馈异常',
      isAbnormal: true,
      followupId: 'f1',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 7, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 3, threshold: 4 },
        { type: 'bleeding', name: '伤口渗血', value: 3, threshold: 3 }
      ]
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
      title: '回访完成 - 医生电话回访',
      description: '患者诉疼痛评分4分，面部轻微肿胀，已指导冰敷',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 4, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 2, threshold: 4 }
      ],
      doctorNotes: '患者诉疼痛评分4分，面部轻微肿胀，已指导冰敷',
      patientSymptoms: '轻微疼痛，面部稍肿',
      highScoreObservations: []
    },
    {
      id: 't1-3',
      date: '2026-06-20',
      type: 'followup',
      title: '回访完成 - 建议复诊',
      description: '患者反馈疼痛加剧，评分7分，伤口有渗血，建议复诊检查',
      isAbnormal: true,
      action: 'revisit',
      photos: ['https://picsum.photos/id/237/300/300'],
      observations: [
        { type: 'pain', name: '疼痛评分', value: 7, threshold: 5 },
        { type: 'bleeding', name: '伤口渗血', value: 3, threshold: 3 },
        { type: 'swelling', name: '面部肿胀', value: 3, threshold: 4 }
      ],
      doctorNotes: '建议复诊检查，开消炎药物',
      patientSymptoms: '今天开始疼痛加剧，伤口有少量渗血，肿胀没有明显消退',
      highScoreObservations: [
        { type: 'pain', name: '疼痛评分', value: 7, threshold: 5 }
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
      followupId: 'f2',
      observations: [
        { type: 'pain', name: '疼痛评分', threshold: 5 },
        { type: 'occlusion', name: '咬合不适', threshold: 3 },
        { type: 'swelling', name: '面部肿胀', threshold: 4 }
      ]
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
      title: '回访完成 - 护士代办',
      description: '患者无明显不适，咬合正常，护士已完成常规回访',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 2, threshold: 5 },
        { type: 'occlusion', name: '咬合不适', value: 1, threshold: 3 }
      ],
      doctorNotes: '常规回访，一切正常',
      patientSymptoms: '无明显不适',
      highScoreObservations: []
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
      followupId: 'f5',
      observations: [
        { type: 'pain', name: '疼痛评分', threshold: 5 },
        { type: 'swelling', name: '面部肿胀', threshold: 4 }
      ]
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
      title: '回访完成 - 医生电话回访',
      description: '恢复良好，轻微疼痛，无肿胀',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 2, threshold: 5 }
      ],
      doctorNotes: '恢复良好',
      patientSymptoms: '轻微疼痛',
      highScoreObservations: []
    },
    {
      id: 't3-3',
      date: '2026-06-17',
      type: 'followup',
      title: '回访完成 - 护士代办',
      description: '伤口愈合良好，无红肿渗出',
      isAbnormal: false,
      action: 'nurse',
      doctorNotes: '伤口愈合良好',
      patientSymptoms: '伤口有些发痒',
      highScoreObservations: []
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
      followupId: 'f3',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 4, threshold: 4 },
        { type: 'occlusion', name: '咬合不适', value: 3, threshold: 3 }
      ]
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
      title: '回访完成 - 医生电话回访',
      description: '面部明显肿胀，疼痛评分6分，已电话指导用药',
      isAbnormal: false,
      action: 'call',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 6, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 3, threshold: 4 }
      ],
      doctorNotes: '已电话指导用药',
      patientSymptoms: '面部明显肿胀，疼痛',
      highScoreObservations: [
        { type: 'pain', name: '疼痛评分', value: 6, threshold: 5 }
      ]
    },
    {
      id: 't4-3',
      date: '2026-06-18',
      type: 'followup',
      title: '回访完成 - 建议复诊',
      description: '肿胀未消退，咬合不适加重，建议来院复查',
      isAbnormal: true,
      action: 'revisit',
      photos: ['https://picsum.photos/id/1062/300/300'],
      observations: [
        { type: 'swelling', name: '面部肿胀', value: 4, threshold: 4 },
        { type: 'occlusion', name: '咬合不适', value: 3, threshold: 3 },
        { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 }
      ],
      doctorNotes: '建议复诊进一步检查',
      patientSymptoms: '脸还是很肿，吃东西的时候感觉不太舒服',
      highScoreObservations: [
        { type: 'swelling', name: '面部肿胀', value: 4, threshold: 4 },
        { type: 'occlusion', name: '咬合不适', value: 3, threshold: 3 },
        { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 }
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
      followupId: 'f4',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 6, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 2, threshold: 4 },
        { type: 'bleeding', name: '伤口渗血', value: 2, threshold: 3 }
      ]
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
      title: '回访完成 - 护士代办',
      description: '植骨区域仍有疼痛，护士已记录并上报医生',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 },
        { type: 'swelling', name: '面部肿胀', value: 2, threshold: 4 }
      ],
      doctorNotes: '需上报医生关注',
      patientSymptoms: '植骨的地方还是有点疼',
      highScoreObservations: [
        { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 }
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
      followupId: 'f6',
      observations: [
        { type: 'pain', name: '疼痛评分', threshold: 5 },
        { type: 'swelling', name: '面部肿胀', threshold: 4 }
      ]
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
      title: '回访完成 - 护士代办',
      description: '无明显不适，护士电话回访完成',
      isAbnormal: false,
      action: 'nurse',
      observations: [
        { type: 'pain', name: '疼痛评分', value: 1, threshold: 5 }
      ],
      doctorNotes: '常规回访完成',
      patientSymptoms: '无明显不适',
      highScoreObservations: []
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
      { type: 'pain', name: '疼痛评分', value: 7, threshold: 5 },
      { type: 'swelling', name: '面部肿胀', value: 3, threshold: 4 },
      { type: 'bleeding', name: '伤口渗血', value: 3, threshold: 3 }
    ],
    patientPhotos: ['https://picsum.photos/id/237/300/300'],
    patientSymptoms: '今天开始疼痛加剧，伤口有少量渗血，肿胀没有明显消退',
    createdAt: '2026-06-20',
    templateName: '标准术后回访方案'
  },
  {
    id: 'f2',
    patientId: '2',
    patientName: '李秀英',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分', threshold: 5 },
      { type: 'occlusion', name: '咬合不适', threshold: 3 },
      { type: 'swelling', name: '面部肿胀', threshold: 4 }
    ],
    createdAt: '2026-06-18',
    templateName: '标准术后回访方案'
  },
  {
    id: 'f3',
    patientId: '4',
    patientName: '陈美玲',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: true,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 5, threshold: 5 },
      { type: 'swelling', name: '面部肿胀', value: 4, threshold: 4 },
      { type: 'occlusion', name: '咬合不适', value: 3, threshold: 3 }
    ],
    patientPhotos: ['https://picsum.photos/id/1062/300/300'],
    patientSymptoms: '脸还是很肿，吃东西的时候感觉不太舒服',
    createdAt: '2026-06-18',
    templateName: '植骨加强回访方案'
  },
  {
    id: 'f4',
    patientId: '10',
    patientName: '郑晓燕',
    scheduledDate: '2026-06-20',
    status: 'pending',
    isAbnormal: true,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 6, threshold: 5 },
      { type: 'swelling', name: '面部肿胀', value: 2, threshold: 4 },
      { type: 'bleeding', name: '伤口渗血', value: 2, threshold: 3 }
    ],
    patientSymptoms: '植骨的地方还是有点疼，早上刷牙有少量血丝',
    createdAt: '2026-06-20',
    templateName: '植骨加强回访方案'
  },
  {
    id: 'f5',
    patientId: '3',
    patientName: '王建国',
    scheduledDate: '2026-06-18',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分', value: 3, threshold: 5 },
      { type: 'swelling', name: '面部肿胀', value: 1, threshold: 4 }
    ],
    patientSymptoms: '伤口有些发痒，其他还好',
    createdAt: '2026-06-10',
    templateName: '标准术后回访方案'
  },
  {
    id: 'f6',
    patientId: '8',
    patientName: '周小芳',
    scheduledDate: '2026-06-22',
    status: 'pending',
    isAbnormal: false,
    observations: [
      { type: 'pain', name: '疼痛评分', threshold: 5 },
      { type: 'swelling', name: '面部肿胀', threshold: 4 }
    ],
    createdAt: '2026-06-19',
    templateName: '标准术后回访方案'
  }
];

export const mockTodoItems: TodoItem[] = [
  {
    id: 'todo1',
    patientId: '1',
    patientName: '张明华',
    type: 'highScore',
    title: '疼痛、渗血异常高分',
    description: '疼痛7分、渗血3分，均超过阈值，建议立即处理',
    priority: 'high',
    scheduledDate: '2026-06-20',
    isRead: false,
    highScoreTypes: ['pain', 'bleeding'],
    followupId: 'f1'
  },
  {
    id: 'todo2',
    patientId: '4',
    patientName: '陈美玲',
    type: 'highScore',
    title: '疼痛、肿胀、咬合异常高分',
    description: '疼痛5分、肿胀4分、咬合3分，均超过阈值，需尽快回访',
    priority: 'high',
    scheduledDate: '2026-06-20',
    isRead: false,
    highScoreTypes: ['pain', 'swelling', 'occlusion'],
    followupId: 'f3'
  },
  {
    id: 'todo3',
    patientId: '10',
    patientName: '郑晓燕',
    type: 'highScore',
    title: '疼痛异常高分',
    description: '植骨区域疼痛6分超过阈值，需关注',
    priority: 'medium',
    scheduledDate: '2026-06-20',
    isRead: true,
    highScoreTypes: ['pain'],
    followupId: 'f4'
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
    isRead: true,
    followupId: 'f2'
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
    isRead: false,
    followupId: 'f5'
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
    isRead: true,
    followupId: 'f6'
  },
  {
    id: 'todo7',
    patientId: '4',
    patientName: '陈美玲',
    type: 'revisit',
    title: '建议复诊提醒',
    description: '肿胀未消退，咬合不适，建议尽快复诊进一步检查',
    priority: 'high',
    scheduledDate: '2026-06-25',
    isRead: false
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
