// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  console.log(wxContext)
  return {
    openid: wxContext.OPENID,  // 获取用户 openid
    appid: wxContext.APPID,    // 获取小程序 appid
    unionid: wxContext.UNIONID // 获取 unionid（需要用户绑定公众号和小程序）
  };
};
