Page({
  data: {
    _id: '',
    todo: {
      title: '',
      leader: '',
      deadline: ''
    },
    freqOptions: ['未完成', '已完成'],
    tasks: [], // List of tasks
    newTask: "", // Input for new task
  },

  onLoad(options) {
    if (options.id !== undefined) {
      this.setData({
        _id: options.id
      })
    }
  },

  async onShow() {
    if (this.data._id.length > 0) {
      const db = await getApp().database()
      db.collection(getApp().globalData.collection).where({
        _id: this.data._id
      }).get().then(res => {
        const { data: [todo] } = res
        this.setData({
          todo
        })
      })
    }
  },

  fetchTasks() {
    const fetchedTasks = [
      { name: "任务一", done: false },
      { name: "任务二", done: false },
    ];
    this.setData({ tasks: fetchedTasks });
  },

  onTaskInput(e) {
    this.setData({ newTask: e.detail.value });
    console.log(tasks)
  },

  addTask() {
    wx.showModal({
      title: '添加任务',
      content: '',
      editable: true, // Enables the input box
      placeholderText: '请输入任务名称',
      success: (res) => {
        if (res.confirm) {
          const newTaskName = res.content.trim(); // Get user input
          if (newTaskName) {
            // Add the new task to the todo list
            this.setData({
              tasks: [...this.data.tasks, { name: newTaskName, done: false }]
            });
            console.log(this.data.tasks)
            // Show a success toast
            wx.showToast({
              title: '任务已添加',
              icon: 'success',
              duration: 2000
            });
          } else {
            wx.showToast({
              title: '任务名不能为空',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },
  async toggleTodo(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const { tasks } = this.data;

    tasks[index].done = !tasks[index].done;
    this.setData({
        tasks
    });
    const db = await getApp().database()
    // 校验通过后，根据待办 _id，更新待办信息
    db.collection(getApp().globalData.collection).where({
      _id: this.data._id
    }).update({
      data: {
        tasks: tasks
      }
    })

  },

  // 跳转响应函数
  toFileList() {
    wx.navigateTo({
      url: '../file/index?id=' + this.data._id,
    })
  },
  
  toEditPage() {
    wx.navigateTo({
      url: '../edit/index?id=' + this.data._id,
    })
  }
})