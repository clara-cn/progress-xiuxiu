/* 待办列表首页 */

Page({
  // 存储请求结果
  data: {
    todos: [], // 用户的所有待办事项
    pending: [], // 未完成待办事项
    finished: [], // 已完成待办事项
    hasUserInfo: false,
    userInfo: null,
    slideButtons: [
      {
        type: 'warn',
        text: '删除',
        src: '../../images/list/trash.png' // Replace with your delete icon path
      }
    ],
    daysLeft: 0,
    realName: ''
  },

  onLoad() {
    const app = getApp();
    app.on('userInfoUpdated', (userInfo) => {
      this.setData({ userInfo, hasUserInfo: true });
    });

    if (app.globalData.userInfo && !this.data.hasUserInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
      });
    }
    this.loadTodos()
  },

  onShow() {
    this.loadTodos();  // Refresh todos each time the page is shown
  },

  // Load todos from the database and calculate days left
  async loadTodos() {
    const db = wx.cloud.database();
    const app = getApp();
    const openid = await app.getOpenId();

    db.collection(app.globalData.collection).where({
      _openid: openid
    }).get().then(res => {
      const { data } = res;

      console.log(res.data.length)
      app.globalData.todoNum = res.data.length;

      const todosWithDaysLeft = data.map(todo => {
        if (todo.deadlineDate) {
          const deadlineDate = new Date(todo.deadlineDate); // Convert from stored format if necessary
          todo.daysLeft = this.calculateDaysLeft(deadlineDate);
        } else {
          todo.daysLeft = null; // No deadline set
        }
        return todo;
      });

      // Update data for rendering
      this.setData({
        todos: todosWithDaysLeft,
        pending: todosWithDaysLeft.filter(todo => todo.freq === 0),
        finished: todosWithDaysLeft.filter(todo => todo.freq === 1)
      });
    }).catch(error => {
      console.error("Failed to fetch todos:", error);
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
          app.globalData.realName = this.data.realName;
        } else {
          console.log("User canceled or did not enter a name");
        }
      },
    });
  },

  async getUserProfile() {  // Make the function itself async
    wx.getUserProfile({
      desc: '用于完善个人资料',  // Prompt explaining the need for user info
      success: async (res) => {  // Make the success handler async
        console.log('用户信息：', res.userInfo);
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
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
                user_role: 'user',
                real_name: res.userInfo.real_name,
              }
            }).then(result => {
              console.log("Document added successfully, _id:", result._id);
              this.setData({
                _id: result._id, // Store the _id in the page's data if needed
              });
            });
            console.log('用户信息已添加');
            if (app.globalData.isFirstTime || !res.userInfo.real_name) {
              this.checkAdditionalInfo()
            } else {
              app.globalData.realName = res.userInfo.real_name;
            }
            // wx.navigateBack({ delta: 1 });
          }
        } catch (err) {
          console.error('数据库查询或添加数据失败:', err);
        }
        wx.setStorageSync('userInfo', res.userInfo);
        app.globalData.userInfo = res.userInfo;
        app.emit('userInfoUpdated', res.userInfo);
        this.loadTodos()
      },
      fail: (err) => {
        console.log('获取用户信息失败', err);
      }
    });
  },

  // 响应左划按钮事件
  async slideButtonTap(e) {
    const { index } = e.currentTarget.dataset;
    const itemId = this.data.pending[index]._id;
    const db = await getApp().database()

    db.collection(getApp().globalData.collection).doc(itemId).remove().then(() => {
      const updatedPending = [...this.data.pending];
      updatedPending.splice(index, 1);
      wx.showToast({ title: '删除成功', icon: 'success' });
    }).catch(err => {
      console.error("Error deleting item:", err);
      wx.showToast({ title: '删除失败', icon: 'error' });
    });
      // 更新本地数据，快速更新显示
    this.data.pending.splice(index, 1)
    this.setData({
      pending: this.data.pending
    })
      // 如果删除完所有事项，刷新数据，让页面显示无事项图片
    if (this.data.pending.length === 0 && this.data.finished.length === 0) {
      this.setData({
        todos: [],
        pending: [],
        finished: []
      })
    }
  },

  // 点击左侧单选框时，切换待办状态
  async finishTodo(e) {
    // 根据序号获得触发切换事件的待办
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    const db = await getApp().database()
    // 根据待办 _id，获得并更新待办事项状态
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      // freq == 1 表示待办已完成，不再提醒
      // freq == 0 表示待办未完成，每天提醒
      data: {
        freq: 1
      }
    })
    // 快速刷新数据
    todo.freq = 1
    this.setData({
      pending: this.data.todos.filter(todo => todo.freq === 0),
      finished: this.data.todos.filter(todo => todo.freq === 1)
    })
  },

  // 同上一函数，将待办状态设置为未完成
  async resetTodo(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.finished[todoIndex]
    const db = await getApp().database()
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      data: {
        freq: 0
      }
    })
    todo.freq = 0
    this.setData({
      pending: this.data.todos.filter(todo => todo.freq === 0),
      finished: this.data.todos.filter(todo => todo.freq === 1)
    })
  },

  calculateDaysLeft(deadlineDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zero out time to get accurate full-day difference
    deadlineDate.setHours(0, 0, 0, 0);
  
    const timeDifference = deadlineDate - today;
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert ms to days and round up
  },

  // 跳转响应函数
  toFileList(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../file/index?id=' + todo._id,
    })
  },

  toDetailPage(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../detail/index?id=' + todo._id,
    })
  },

  toAddPage() {
    wx.navigateTo({
      url: '../../pages/add/index',
    })
  }

})