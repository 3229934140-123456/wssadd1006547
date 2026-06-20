export default defineAppConfig({
  pages: [
    'pages/patient/index',
    'pages/todo/index',
    'pages/mine/index',
    'pages/patient-detail/index',
    'pages/add-followup/index',
    'pages/followup-detail/index',
    'pages/add-patient/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0F766E',
    navigationBarTitleText: '种植随访',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAFC'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#0F766E',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/patient/index',
        text: '患者列表'
      },
      {
        pagePath: 'pages/todo/index',
        text: '异常待办'
      },
      {
        pagePath: 'pages/mine/index',
        text: '个人中心'
      }
    ]
  }
})
