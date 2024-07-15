const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

function sendmess (appid, mess) {
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: `http://api.weixin.qq.com/cgi-bin/message/custom/send?from_appid=${appid}`,
      body: JSON.stringify(mess)
    }, function (error, response) {
      if (error) {
        console.log('接口返回错误', error)
        reject(error.toString())
      } else {
        console.log('接口返回内容', response.body)
        resolve(response.body)
      }
    })
  })
}

app.post('/api/msg', async (req, res) => {
  console.log('消息推送', req.body)
  // 从header中取appid，如果from-appid不存在，则不是资源复用场景，可以直接传空字符串，使用环境所属账号发起云调用
  const appid = req.headers['x-wx-from-appid'] || ''
  const { ToUserName, FromUserName, MsgType, Content, CreateTime } = req.body
  console.log('推送接收的账号', ToUserName, '创建时间', CreateTime)
  console.log('消息推送', req.body)
  if (MsgType === 'text') {
    if (Content === '回复文字') { // 小程序、公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'text',
        text: {
          content: '这是回复的消息'
        }
      })
    } else if (Content === '回复图片') { // 小程序、公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'image',
        image: {
          media_id: 'P-hoCzCgrhBsrvBZIZT3jx1M08WeCCHf-th05M4nac9TQO8XmJc5uc0VloZF7XKI'
        }
      })
    } else if (Content === '回复语音') { // 仅公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'voice',
        voice: {
          media_id: '06JVovlqL4v3DJSQTwas1QPIS-nlBlnEFF-rdu03k0dA9a_z6hqel3SCvoYrPZzp'
        }
      })
    } else if (Content === '回复视频') {  // 仅公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'video',
        video: {
          media_id: 'XrfwjfAMf820PzHu9s5GYsvb3etWmR6sC6tTH2H1b3VPRDedW-4igtt6jqYSBxJ2',
          title: '微信云托管官方教程',
          description: '微信官方团队打造，贴近业务场景的实战教学'
        }
      })
    } else if (Content === '回复音乐') {  // 仅公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'music',
        music: {
          title: 'Relax｜今日推荐音乐',
          description: '每日推荐一个好听的音乐，感谢收听～',
          music_url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          HQ_music_url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U',
          thumb_media_id: 'XrfwjfAMf820PzHu9s5GYgOJbfbnoUucToD7A5HFbBM6_nU6TzR4EGkCFTTHLo0t'
        }
      })
    } else if (Content === '回复图文') {  // 小程序、公众号可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'link',
        link: {
          title: 'Relax｜今日推荐音乐',
          description: '每日推荐一个好听的音乐，感谢收听～',
          thumb_url: 'https://y.qq.com/music/photo_new/T002R300x300M000004NEn9X0y2W3u_1.jpg?max_age=2592000', // 支持JPG、PNG格式，较好的效果为大图360*200，小图200*200
          url: 'https://c.y.qq.com/base/fcgi-bin/u?__=0zVuus4U'
        }
      })
    } else if (Content === '回复小程序') { // 仅小程序可用
      await sendmess(appid, {
        touser: FromUserName,
        msgtype: 'miniprogrampage',
        miniprogrampage: {
          title: '小程序卡片标题',
          pagepath: 'pages/index/index', // 跟app.json对齐，支持参数，比如pages/index/index?foo=bar
          thumb_media_id: 'XrfwjfAMf820PzHu9s5GYgOJbfbnoUucToD7A5HFbBM6_nU6TzR4EGkCFTTHLo0t'
        }
      })
    }
    res.send('success')
  } else {
    res.send('success')
  }
})

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  //await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
