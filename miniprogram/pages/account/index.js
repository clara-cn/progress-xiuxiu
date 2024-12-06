Page({
  data: {
    userInfo: null,  // 存储用户信息
    hasUserInfo: false,  // 用于判断是否已经获取用户信息
    avatarUrl: '',
    realName: '',
  },

  onLoad() {
    const app = getApp();
    app.on('userInfoUpdated', (userInfo) => {
      this.setData({ userInfo, hasUserInfo: true, avatarUrl: '', realName: '' });
    });

    if (app.globalData.userInfo) {
      console.log(app.globalData.realName)
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        avatarUrl: app.globalData.userInfo.avatarUrl,
        realName: app.globalData.realName,
      });
    }
  },

  async getUserProfile() {  // Make the function itself async
    wx.getUserProfile({
      desc: '用于完善个人资料',  // Prompt explaining the need for user info
      success: async (res) => {  // Make the success handler async
        console.log('用户信息：', res);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          avatarUrl: res.userInfo.avatarUrl
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
                avatarUrl: res.userInfo.avatarUrl,
                user_role: 'user'
              }
            }).then(result => {
              console.log("Document added successfully, _id:", result._id);
              this.setData({
                _id: result._id, // Store the _id in the page's data if needed
              });
            });
            if (app.globalData.isFirstTime || !res.userInfo.real_name) {
              this.checkAdditionalInfo()
            } else {
              app.globalData.realName = res.userInfo.real_name;
            }
            console.log('用户信息已添加');
            // wx.navigateBack({ delta: 1 });
          }
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
            _id: this.data._id
          }).update({
            data: {
              real_name: this.data.realName,
            }
          })
        } else {
          console.log("User canceled or did not enter a name");
        }
      },
    });
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
              nickName: newInput
            });
            db.collection('user').where({
              _id: this.data._id
            }).update({
              real_name: this.data.realName
            })
            app.globalData.realName = this.data.realName;
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
    console.log("OHHH")
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  }
});
