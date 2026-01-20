# 齐家AI 数据看板

实时数据展示与分析平台，帮助团队监控产品质量和用户反馈。

## 功能模块

- **基础数据**：核心指标、转化率、趋势图
- **用户评分**：评分分布、趋势分析
- **点踩数据**：点踩统计与趋势
- **AB版本对比**：心理咨询风格 vs 教练技术风格

## 技术栈

- 前端：React + Vite + Recharts
- 后端：Node.js + Express
- 部署：Railway

## 本地开发

```bash
# 安装依赖
npm install
npm install --prefix server
npm install --prefix client

# 启动开发服务器
npm run dev
```

## 部署

项目已配置 Railway 自动部署，推送到 main 分支即可触发部署。
