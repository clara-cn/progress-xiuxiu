App({
  async onLaunch() {
    this.initcloud();

    this.globalData = {
      userInfo: null,
      hasUserInfo: false,
      collection: 'todo',
      user_db: 'user',
      fileLimit: 2,
      isFirstTime: false,
      openid: null,
      realName: '',
      todoNum: 0,
      todoFinishedNum: 0,
      manageTodoNum: 0,
      responNum: 0,
      user_id: '',
      user_avatarUrl: '',
    };

    this.eventBus = {};
    this.on = (eventName, callback) => {
      if (!this.eventBus[eventName]) this.eventBus[eventName] = [];
      this.eventBus[eventName].push(callback);
    };
    this.emit = (eventName, data) => {
      const callbacks = this.eventBus[eventName] || [];
      callbacks.forEach(callback => callback(data));
    };

    const db = wx.cloud.database();
    await this.getUserOpenID(); 
    const res = await db.collection('user').where({
      _openid: this.globalData.openid, // Check if user exists in the database
    }).get();


    const isFirstTime = wx.getStorageSync('isFirstTime');

    if (res.data.length === 0 && !isFirstTime) {
      console.log("First time user detected");

      await db.collection('user').add({
        data: {
          _openid: this.globalData.openid,
          user_name: '',
          avatarUrl: '',
          createdAt: new Date(),
        },
      });
      this.globalData.isFirstTime = true;
      wx.setStorageSync('isFirstTime', true);
    } else {
      console.log("User already visited");
      this.globalData.isFirstTime = false;
    }

  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.hasUserInfo = true;
    wx.setStorageSync('userInfo', userInfo);  // Store user info locally
  },

  flag: false,

  async initcloud() {
    const shareinfo = wx.getExtConfigSync();
    const normalinfo = require('./envList.js').envList || [];

    if (shareinfo.envid != null) {
      this.c1 = new wx.cloud.Cloud({
        resourceAppid: shareinfo.appid,
        resourceEnv: shareinfo.envid,
      });

      this.cloud = async () => {
        if (!this.flag) {
          await this.c1.init();
          this.flag = true;
        }
        return this.c1;
      };
    } else {
      if (normalinfo.length != 0 && normalinfo[0].envId != null) {
        wx.cloud.init({
          traceUser: true,
          env: normalinfo[0].envId,
        });

        this.cloud = () => wx.cloud;
      } else {
        this.cloud = () => {
          wx.showModal({
            content: '当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境', 
            showCancel: false,
          });
          throw new Error('当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境');
        };
      }
    }
  },

  // 获取用户的 openID，并存储到全局变量
  async getUserOpenID() {  
    try {
        const res = await wx.cloud.callFunction({ name: 'login' });
        console.log('用户 openID:', res.result.openid);
        this.globalData.openid = res.result.openid;
    } catch (err) {
        console.error('调用云函数失败:', err);
    }
  },

  // 获取云数据库实例
  async database() {
    return (await this.cloud()).database();
  },

  // 上传文件操作封装
  async uploadFile(cloudPath, filePath) {
    return (await this.cloud()).uploadFile({
      cloudPath,
      filePath,
    });
  },

  // 下载文件操作封装
  async downloadFile(fileID) {
    return (await this.cloud()).downloadFile({
      fileID,
    });
  },

  // 获取用户唯一标识，兼容不同环境模式
  async getOpenId() {
    try {
      const { result: { openid, fromopenid } } = await (await this.cloud()).callFunction({
        name: 'getOpenId',
      });
      if (openid !== "") return openid;
      return fromopenid;
    } catch (e) {
      let flag = e.toString();
      flag = flag.includes('FunctionName') ? '请在cloudfunctions文件夹中getOpenId上右键，创建部署云端安装依赖，然后再次体验' : flag;
      wx.hideLoading();
      wx.showModal({
        content: flag,
        showCancel: false,
      });
      throw new Error(flag);
    }
  },
});
