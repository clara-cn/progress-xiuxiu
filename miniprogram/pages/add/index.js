/* 新增待办页面 */

Page({
  // 保存编辑中待办的信息
  data: {
    title: '',
    desc: '',
    deadline: '',
    deadlineDate: null,
    freqOptions: ['未完成', '已完成'],
    freq: 0,
    users: [],
    realNames: [],
    leader: 0,
    leaderId: '',
    staffIds: [], // Selected staff IDs
    staffNames: [], // Selected staff names
    dropdownOpen: false, // Tracks if the dropdown is open
    progress: 0,
  },

  onLoad() {
    this.fetchUsers();
  },

  async fetchUsers() {
    const db = wx.cloud.database();
    try {
      const res = await db.collection("user").get();
      const realNames = res.data.map(user => user.real_name);

      this.setData({
        users: res.data,    // Array of user objects (with _id and user_name)
        realNames: realNames 
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      desc: e.detail.value
    })
  },

  // 响应事件状态选择器
  onChooseFreq(e) {
    this.setData({
      freq: e.detail.value
    })
  },

  onChooseLeader(e) {
    const leaderIndex = e.detail.value; // Index of the selected leader
    const leaderId = this.data.users[leaderIndex]._openid; // Get _id of the selected leader

    this.setData({
      leader: leaderIndex,
      leaderName: this.data.users[leaderIndex].real_name,
      leaderId: leaderId
    });
  },

  onDeadlineChange(e) {
    const selectedDateStr = e.detail.value; // Date in "YYYY-MM-DD" format
    const selectedDate = new Date(selectedDateStr); // Convert to Date object

    this.setData({
      deadline: selectedDateStr,   // Store formatted date string for display
      deadlineDate: selectedDate   // Save Date object for manipulation
    });
  },

  toggleDropdown() {
    this.setData({
      dropdownOpen: !this.data.dropdownOpen
    });
  },

  onChooseStaff(e) {
    const selectedIds = e.detail.value; // Array of selected user IDs
    const selectedNames = this.data.users
      .filter(user => selectedIds.includes(user._id))
      .map(user => user.real_name); // Get corresponding names

      this.setData({
        staffIds: selectedIds,
        staffNames: selectedNames
      });
  },

  onProgressChange(e) {
    const value = e.detail.value; // Slider value (0-100)
    this.setData({
      progress: value
    });
    console.log('Progress updated to:', value);
  },


  // 保存待办
  async saveTodo() {
    // 对输入框内容进行校验
    if (this.data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.leaderId === '') {
      wx.showToast({
        title: '选择项目负责人',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.title.length > 20) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.desc.length > 100) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.deadline.length === '') {
      wx.showToast({
        title: '选择截止日期',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.staffIds === []) {
      wx.showToast({
        title: '选择工作人员',
        icon: 'error',
        duration: 2000
      })
      return
    }
    const db = wx.cloud.database();

    db.collection(getApp().globalData.collection).add({
      data: {
        title: this.data.title,       // 待办标题
        desc: this.data.desc,         // 待办描述
        freq: Number(this.data.freq), // 待办完成情况（提醒频率）
        deadline: this.data.deadline,
        deadlineDate: this.data.deadlineDate,
        leader: this.data.leaderId,
        leaderName: this.data.leaderName,
        staffIds: this.data.staffIds,
        staffNames: this.data.staffNames,
        progress: this.data.progress,
      }
    }).then(() => {
      wx.navigateBack({
        delta: 0,
      });
    }).catch(err => {
      console.error('添加数据失败:', err);
    });
  },

  // 重置所有表单项
  resetTodo() {
    this.setData({
      title: '',
      desc: '',
      files: [],
      fileName: '',
      freqOptions: ['未完成', '已完成'],
      freq: 0,
      users: [],
      realNames: [],
      leader: 0,
      leaderId: ''
    })
  }
})