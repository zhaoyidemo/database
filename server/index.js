const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 真实后端 API 地址
const REAL_API_URL = 'http://47.116.208.226:9000';

app.use(cors());
app.use(express.json());

// 代理 /api 请求到真实后端
app.use('/api', createProxyMiddleware({
  target: REAL_API_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[代理] ${req.method} ${req.path} -> ${REAL_API_URL}${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('代理错误:', err);
    res.status(500).json({ error: '代理请求失败', message: err.message });
  }
}));

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`齐家AI数据看板服务运行在端口 ${PORT}`);
  console.log(`API代理目标: ${REAL_API_URL}`);
});
