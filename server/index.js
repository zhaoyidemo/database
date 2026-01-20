const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 生成模拟趋势数据
function generateTrendData(days = 7) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const conversations = Math.floor(Math.random() * 200) + 100;
    const insights = Math.floor(Math.random() * conversations * 0.8) + 20;
    const ratings = Math.floor(Math.random() * insights * 0.8) + 10;
    data.push({
      date: date.toISOString().split('T')[0],
      conversations,
      insights,
      dialogRounds: Math.floor(Math.random() * 500) + 200,
      ratings,
      // 转化率
      insightTriggerRate: ((insights / conversations) * 100).toFixed(1),
      ratingRate: ((ratings / insights) * 100).toFixed(1)
    });
  }
  return data;
}

// 模拟数据
const mockData = {
  // 基础数据 - 核心指标
  coreMetrics: {
    yesterday: {
      conversations: 156,      // 发起对话人数
      insights: 98,            // 生成洞察人数
      dialogRounds: 423,       // 对话轮数
      ratings: 67              // 评分人数
    },
    total: {
      conversations: 12580,
      insights: 8920,
      dialogRounds: 45600,
      ratings: 5430
    }
  },

  // 转化率指标
  conversionRates: {
    insightTriggerRate: 62.8,  // 洞察触发率
    ratingRate: 68.4           // 评分率
  },

  // 用户评分分布
  ratingDistribution: {
    five: { count: 35, percentage: 52.2 },
    four: { count: 22, percentage: 32.8 },
    low: { count: 10, percentage: 14.9 },    // 1-3分
    unrated: { count: 31, percentage: null }  // 未评分
  },

  // 点踩数据
  thumbsDown: {
    count: 18,        // 点踩轮次数
    users: 12,        // 点踩人数（去重）
    rate: 4.3         // 点踩率
  },

  // AB版本对比数据
  abComparison: {
    versionA: {  // 心理咨询风格
      conversations: 78,
      insights: 52,
      dialogRounds: 215,
      ratings: 35,
      insightTriggerRate: 66.7,
      ratingRate: 67.3,
      fiveStar: { count: 19, percentage: 54.3 },
      fourStar: { count: 11, percentage: 31.4 },
      lowStar: { count: 5, percentage: 14.3 },
      unrated: 17,
      thumbsDownCount: 8,
      thumbsDownRate: 3.7
    },
    versionB: {  // 教练技术风格
      conversations: 78,
      insights: 46,
      dialogRounds: 208,
      ratings: 32,
      insightTriggerRate: 59.0,
      ratingRate: 69.6,
      fiveStar: { count: 16, percentage: 50.0 },
      fourStar: { count: 11, percentage: 34.4 },
      lowStar: { count: 5, percentage: 15.6 },
      unrated: 14,
      thumbsDownCount: 10,
      thumbsDownRate: 4.8
    }
  }
};

// API路由

// 获取所有仪表盘数据
app.get('/api/dashboard', (req, res) => {
  res.json(mockData);
});

// 获取核心指标
app.get('/api/metrics/core', (req, res) => {
  res.json(mockData.coreMetrics);
});

// 获取转化率
app.get('/api/metrics/conversion', (req, res) => {
  res.json(mockData.conversionRates);
});

// 获取趋势数据
app.get('/api/trends', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  res.json(generateTrendData(days));
});

// 获取评分分布
app.get('/api/ratings', (req, res) => {
  res.json(mockData.ratingDistribution);
});

// 获取评分趋势
app.get('/api/ratings/trend', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      fiveStar: Math.floor(Math.random() * 40) + 20,
      fourStar: Math.floor(Math.random() * 25) + 10,
      lowStar: Math.floor(Math.random() * 15) + 5
    });
  }
  res.json(data);
});

// 获取点踩数据
app.get('/api/thumbsdown', (req, res) => {
  res.json(mockData.thumbsDown);
});

// 获取点踩趋势
app.get('/api/thumbsdown/trend', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 25) + 5;
    const users = Math.floor(Math.random() * count * 0.8) + 3;
    data.push({
      date: date.toISOString().split('T')[0],
      count,           // 点踩轮次数
      users,           // 点踩人数（去重）
      rate: (Math.random() * 5 + 2).toFixed(1)
    });
  }
  res.json(data);
});

// 获取AB对比数据
app.get('/api/ab-comparison', (req, res) => {
  res.json(mockData.abComparison);
});

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`齐家AI数据看板服务运行在端口 ${PORT}`);
});
