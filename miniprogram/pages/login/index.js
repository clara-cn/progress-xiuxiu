const { privacyPolicyText } = require('../../components/privacyPolicy');
const { userAgreementText } = require('../../components/userAgreement');

Page({
  data: {
    userInfo: null,  // 存储用户信息
    hasUserInfo: false,  // 用于判断是否已经获取用户信息
    // avatarUrl: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    avatarUrl: "../../images/account/profile2.PNG",
    realName: '',
    isChecked: false,
  },

  onLoad() {
    const app = getApp();
    app.on('userInfoUpdated', (userInfo) => {
      this.setData({ userInfo, hasUserInfo: true, avatarUrl: '', realName: '' });
    });

    if (app.globalData.userInfo) {
      console.log(app.globalData)
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        avatarUrl: app.globalData.user_avatarUrl,
        realName: app.globalData.realName,
      });
    }
  },

  async getUserProfile() {  // Make the function itself async
    if (!this.data.isChecked) {
      wx.showToast({
        title: '请同意隐私协议和用户协议',
        icon: 'none',
      });
      return;
    }
    wx.getUserProfile({
      desc: '用于完善个人资料',  // Prompt explaining the need for user info
      success: async (res) => {  // Make the success handler async
        console.log('用户信息：', res);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
        });
        console.log(this.data.realName)

        const db = wx.cloud.database();
        const app = getApp();
        try {
          const user_db = await db.collection('user').where({
            _id: app.globalData.openid
          }).get();
  
          if (user_db.data.length === 0) {
            await db.collection(app.globalData.user_db).add({
              data: {
                _id: app.globalData.openid,
                user_name: res.userInfo.nickName,
                avatarUrl: avatarUrl,
                user_role: 'user'
              }
            }).then(result => {
              app.globalData.user_id = result._id
            });
          }
          if (app.globalData.isFirstTime || !res.userInfo.real_name) {
            this.checkAdditionalInfo()
          } else {
            app.globalData.realName = user_db.data[0].real_name;
            app.globalData.user_id = user_db.data[0]._id;
            app.globalData.user_avatarUrl = user_db.data[0].avatarUrl;
          }
          console.log("GLOBAL", app.globalData)
          wx.reLaunch({
            url: '../../pages/list/index',
          })
        } catch (err) {
          console.error('数据库查询或添加数据失败:', err);
        }
        wx.setStorageSync('userInfo', res.userInfo);
        app.globalData.userInfo = res.userInfo;
        app.emit('userInfoUpdated', res.userInfo);
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
      }
    });
  },

  checkAdditionalInfo() {
    wx.showModal({
      title: '欢迎来到进度咻咻',
      content: '',
      editable: true,
      placeholderText: '输入您的姓名',
      success: async (res) => {
        if (res.confirm && res.content) {
          this.setData({
            realName: res.content,
          })
          const db = wx.cloud.database();
          const app = getApp();

          await db.collection(app.globalData.user_db).where({
            _id: app.globalData.user_id
          }).update({
            data: {
              real_name: res.content,
            }
          })
          app.globalData.realName = res.content
        } else {
          console.log("User canceled or did not enter a name");
        }
      },
    });
  },

  onCheckboxChange(e) {
    const isChecked = e.detail.value.includes('agree');
    this.setData({ isChecked });
  },

  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: privacyPolicyText,
      showCancel: false, // 不显示取消按钮
      confirmText: '关闭',
      confirmColor: '#353535',
    });
  },

  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: userAgreementText,
      showCancel: false, // 不显示取消按钮
      confirmText: '关闭',
      confirmColor: '#353535',
    });
  },
});
