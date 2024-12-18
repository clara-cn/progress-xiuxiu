const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event) => {
  const db = cloud.database();
  const _ = db.command;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const isTriggeredByTimer = wxContext.SOURCE === 'wx_client';

  function truncateString(str, maxLength) {
    return str.length > maxLength ? str.substring(0, maxLength) : str;
  }

  function calculateDaysLeft(deadlineDate) {
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }

  try {
    if (isTriggeredByTimer) {
      const res = await db.collection('todo').where({
        _openid: openid
      }).get();
      const data = res.data || [];
      const todosWithDaysLeft = data.map(todo => {
        if (todo.deadlineDate) {
          const deadlineDate = new Date(todo.deadlineDate);
          todo.daysLeft = calculateDaysLeft(deadlineDate);
        } else {
          todo.daysLeft = null;
        }
        return todo;
      });
  
      const todoNum = todosWithDaysLeft.filter(todo => todo.freq === 0).length;
      const messages = [{
        openid: openid,
        projectName: "进度咻咻-项目跟进",
        deadlineDate: new Date().toISOString().slice(0, 10),
        description: truncateString(`请及时更新本周您的项目进度，目前有${todoNum}个未完成项目`, 20)
      }];

      const results = [];
      for (const message of messages) {
        const result = await cloud.openapi.subscribeMessage.send({
          touser: message.openid,
          templateId: '6p-rfJ78msYIIadvTNsXKLza4tXd-bnFNqxw4LWZ8xo',
          page: '/pages/list/index',
          data: {
            thing4: { value: message.projectName },
            time2: { value: message.deadlineDate },
            phrase5: { value: "未完成" },
            thing1: { value: message.description },
          },
        });
        results.push(result);
      }
    return { success: true, results };
    } 
  } catch (error) {
    console.error('Error sending messages:', error);
    return { success: false, error: error.message };
  }
};
