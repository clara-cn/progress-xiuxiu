const { privacyPolicyText } = require('../../components/privacyPolicy');
const { userAgreementText } = require('../../components/userAgreement');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    // avatarUrl: "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    avatarUrl: "../../images/account/profile2.PNG",
    realName: '',
    todoNum: 0,
    todoFinishedNum: 0,
  },

  onLoad() {
    const app = getApp();
    app.on('userInfoUpdated', (userInfo) => {
      this.setData({ userInfo, hasUserInfo: true, avatarUrl: '../../images/account/profile2.PNG', realName: '' });
    });
    this.setData({
      todoNum: app.globalData.todoNum,
      todoFinishedNum: app.globalData.todoFinishedNum,
      manageTodoNum: app.globalData.manageTodoNum
    })
    console.log(this.data.hasUserInfo)

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        avatarUrl: app.globalData.user_avatarUrl,
        realName: app.globalData.realName,
      });
    }
  },

  onShow() {
    if (this.data.hasUserInfo === false) {
      wx.navigateTo({
        url: '../../pages/login/index',
      })
    }
  },

  getUserProfile() {  // Make the function itself async
    wx.navigateTo({
      url: '../../pages/login/index',
    })
  },

  showEditModal() {
    wx.showModal({
      title: '修改昵称',
      content: '',
      editable: true, // Enables the input box
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm) {
          const newInput = res.content.trim(); // Get user input
          const db = wx.cloud.database();
          const app = getApp();
          if (newInput) {
            this.setData({
              realName: newInput
            });
            console.log(app.globalData.user_id, newInput, this.data.realName)
            db.collection('user').where({
              _id: app.globalData.user_id
            }).update({
              data: {
                real_name: newInput
              }
            })
            app.globalData.realName = newInput;
            wx.showToast({
              title: '昵称已修改',
              icon: 'success',
              duration: 2000
            });
          } else {
            wx.showToast({
              title: '名称不能为空',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  toAccountDetailPage() {
    wx.navigateTo({
      url: '../account_detail/index',
    });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const db = wx.cloud.database();
    const app = getApp()

    wx.cloud.uploadFile({
      cloudPath: `avatars/${app.globalData.user_id}-${new Date().getTime()}-${Math.random() * 100}.jpg`,
      filePath: avatarUrl,
      success: async (res) => {

        try {
          await db.collection('user').doc(app.globalData.user_id).update({
            data: {
              avatarUrl: res.fileID,
            },
          });

          this.setData({
            avatarUrl: res.fileID,
          });

          app.globalData.avatarUrl = res.fileID;
          wx.showToast({
            title: '头像上传成功',
            icon: 'success',
          });
        } catch (err) {
          wx.showToast({
            title: '上传失败，请再次尝试',
            icon: 'none',
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '上传失败，请再次尝试',
          icon: 'none',
        });
      },
      complete: () => {
        wx.hideLoading(); // Hide the loading indicator
      },
    })
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

  subscribeApp() {
    const normalinfo = require('./envList.js').envList || [];

    wx.requestSubscribeMessage({
      tmplIds: [normalinfo[0].templateId],
      success(res) {
        if (res[normalinfo[0].templateId] === 'accept') {
          console.log('User accepted subscription');
        } else {
          console.log('User denied subscription');
        }
      },
      fail(err) {
        console.error('Subscription request failed:', err);
      }
    });
    
  }
});
