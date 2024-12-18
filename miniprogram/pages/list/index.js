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
        src: '../../images/list/trash.png'
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
    if (this.data.hasUserInfo === false) {
      wx.navigateTo({
        url: '../../pages/login/index',
      })
    } else {
      this.loadTodos();
    }
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
      app.globalData.todoNum = res.data.length;

      const todosWithDaysLeft = data.map(todo => {
        if (todo.deadlineDate) {
          const deadlineDate = new Date(todo.deadlineDate);
          todo.daysLeft = this.calculateDaysLeft(deadlineDate);
        } else {
          todo.daysLeft = null;
        }
        return todo;
      });

      this.setData({
        todos: todosWithDaysLeft,
        pending: todosWithDaysLeft.filter(todo => todo.freq === 0),
        finished: todosWithDaysLeft.filter(todo => todo.freq === 1)
      });
      app.globalData.todoNum = todosWithDaysLeft.filter(todo => todo.freq === 0).length
      app.globalData.todoFinishedNum = todosWithDaysLeft.filter(todo => todo.freq === 1).length
    }).catch(error => {
      console.error("Failed to fetch todos:", error);
    });
  },

  getUserProfile() {
    wx.navigateTo({
      url: '../../pages/login/index',
    })
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