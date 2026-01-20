# 齐家AI 数据看板 - 后端 API 接口文档

## 目录

- [接口总览](#接口总览)
- [通用约定](#通用约定)
- [数据库表结构假设](#数据库表结构假设)
- [接口详细规范](#接口详细规范)
  - [1. 获取仪表盘数据](#1-获取仪表盘数据)
  - [2. 获取趋势数据](#2-获取趋势数据)
  - [3. 获取评分趋势](#3-获取评分趋势)
  - [4. 获取点踩趋势](#4-获取点踩趋势)
  - [5. 获取AB对比](#5-获取ab对比)
- [关键计算逻辑](#关键计算逻辑)
- [附录：其他辅助接口](#附录其他辅助接口)

---

## 接口总览

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取仪表盘数据 | GET | `/api/dashboard` | 获取所有看板数据（一次性加载，昨日数据） |
| 获取趋势数据 | GET | `/api/trends` | 核心指标趋势（支持天数参数） |
| 获取评分趋势 | GET | `/api/ratings/trend` | 评分分布趋势 |
| 获取点踩趋势 | GET | `/api/thumbsdown/trend` | 点踩数据趋势 |
| 获取AB对比 | GET | `/api/ab-comparison` | AB版本对比数据（支持天数参数） |

> **重要说明**：
> - "昨日"指自然日 00:00 - 24:00 的数据
> - 趋势接口返回的数据按日期**升序排列**（从旧到新），便于图表展示
> - 所有"人数"类指标均为**去重后**的用户数

---

## 通用约定

### 基础信息

- **Base URL**: `http://{host}:{port}/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **日期格式**: ISO 8601（`YYYY-MM-DD`）

### 响应格式

所有接口返回 JSON 格式数据。成功时直接返回数据对象/数组，失败时返回错误信息：

```json
// 成功响应（直接返回数据）
{
  "coreMetrics": { ... },
  "conversionRates": { ... },
  ...
}

// 错误响应
{
  "error": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

---

## 数据库表结构假设

以下为建议的数据库表结构，后端开发者可根据实际情况调整：

### conversations - 对话记录表

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_id VARCHAR(64) NOT NULL,           -- 会话ID
    round_number INTEGER DEFAULT 1,            -- 对话轮次（一问一答 = 1轮）
    message_content TEXT,                      -- 消息内容
    is_user_message BOOLEAN DEFAULT TRUE,      -- 是否为用户消息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
```

### insights - 洞察生成记录表

```sql
CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    conversation_id INTEGER REFERENCES conversations(id),
    insight_type VARCHAR(50),                  -- 洞察类型
    insight_content TEXT,                      -- 洞察内容
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_generated_at ON insights(generated_at);
```

### ratings - 用户评分表

```sql
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    insight_id INTEGER REFERENCES insights(id),
    score INTEGER CHECK (score >= 1 AND score <= 5),  -- 评分（1-5分）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 唯一约束：同一用户对同一洞察只能评分一次
    UNIQUE (user_id, insight_id)
);

-- 索引
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);
CREATE INDEX idx_ratings_score ON ratings(score);
```

### thumbs_down - 点踩记录表

> **说明**：点踩针对的是**单条 AI 回复**，每条记录代表用户对某一条 AI 回复的点踩

```sql
CREATE TABLE thumbs_down (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    conversation_id INTEGER REFERENCES conversations(id),
    round_number INTEGER,                      -- 点踩的对话轮次
    ai_message_id INTEGER,                     -- 被点踩的 AI 回复 ID（可选，用于精确定位）
    reason VARCHAR(255),                       -- 点踩原因（可选）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_thumbs_down_user_id ON thumbs_down(user_id);
CREATE INDEX idx_thumbs_down_created_at ON thumbs_down(created_at);
```

### users - 用户表

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    ab_group CHAR(1) CHECK (ab_group IN ('A', 'B')),  -- AB测试分组
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_ab_group ON users(ab_group);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

## 接口详细规范

### 1. 获取仪表盘数据

获取仪表盘的所有数据（一次性加载），适用于页面初始化。

#### 请求信息

- **URL**: `/api/dashboard`
- **Method**: `GET`
- **请求参数**: 无

#### 响应格式

```json
{
  "coreMetrics": {
    "yesterday": {
      "conversations": 1247,
      "insights": 892,
      "dialogRounds": 3856,
      "ratings": 634
    },
    "total": {
      "conversations": 45678,
      "insights": 32456,
      "dialogRounds": 156789,
      "ratings": 23456
    }
  },
  "conversionRates": {
    "insightTriggerRate": 71.5,
    "ratingRate": 71.1
  },
  "ratingDistribution": {
    "five": {
      "count": 456,
      "percentage": 72.0
    },
    "four": {
      "count": 123,
      "percentage": 19.4
    },
    "low": {
      "count": 55,
      "percentage": 8.6
    },
    "unrated": {
      "count": 258,
      "percentage": null
    }
  },
  "thumbsDown": {
    "count": 89,
    "users": 67,
    "rate": 2.3
  },
  "abComparison": {
    "versionA": {
      "conversations": 623,
      "insights": 456,
      "dialogRounds": 1928,
      "ratings": 324,
      "insightTriggerRate": 73.2,
      "ratingRate": 71.1,
      "fiveStar": { "count": 234, "percentage": 72.2 },
      "fourStar": { "count": 63, "percentage": 19.4 },
      "lowStar": { "count": 27, "percentage": 8.4 },
      "unrated": 132,
      "thumbsDownCount": 42,
      "thumbsDownUsers": 31,
      "thumbsDownRate": 2.2
    },
    "versionB": {
      "conversations": 624,
      "insights": 436,
      "dialogRounds": 1928,
      "ratings": 310,
      "insightTriggerRate": 69.9,
      "ratingRate": 71.1,
      "fiveStar": { "count": 222, "percentage": 71.6 },
      "fourStar": { "count": 60, "percentage": 19.4 },
      "lowStar": { "count": 28, "percentage": 9.0 },
      "unrated": 126,
      "thumbsDownCount": 47,
      "thumbsDownUsers": 36,
      "thumbsDownRate": 2.4
    }
  }
}
```

#### 字段说明

| 字段路径 | 类型 | 说明 |
|----------|------|------|
| `coreMetrics.yesterday.conversations` | number | 昨日发起对话人数（去重） |
| `coreMetrics.yesterday.insights` | number | 昨日生成洞察人数（去重） |
| `coreMetrics.yesterday.dialogRounds` | number | 昨日对话轮数（一问一答 = 1轮） |
| `coreMetrics.yesterday.ratings` | number | 昨日评分人数（去重） |
| `coreMetrics.total.*` | number | 历史累计数据（从数据面板上线日起） |
| `conversionRates.insightTriggerRate` | number | 洞察触发率（%），保留1位小数 |
| `conversionRates.ratingRate` | number | 评分率（%），保留1位小数 |
| `ratingDistribution.five.count` | number | 5分评价人数 |
| `ratingDistribution.five.percentage` | number | 5分占比（%），保留1位小数 |
| `ratingDistribution.four.*` | - | 4分评价数据 |
| `ratingDistribution.low.*` | - | 低分（1-3分）评价数据 |
| `ratingDistribution.unrated.count` | number | 未评分人数（= 生成洞察人数 - 评分人数） |
| `ratingDistribution.unrated.percentage` | null | 未评分不计算占比（始终为 null） |
| `thumbsDown.count` | number | 点踩次数（被点踩的 AI 回复数量） |
| `thumbsDown.users` | number | 点踩人数（去重） |
| `thumbsDown.rate` | number | 点踩率（%），保留1位小数 |
| `abComparison.versionA/B.*` | - | A/B版本各项指标（含义同上） |

#### SQL 参考

```sql
-- 获取昨日核心指标
WITH yesterday_range AS (
    SELECT
        CURRENT_DATE - INTERVAL '1 day' AS start_date,
        CURRENT_DATE AS end_date
)
SELECT
    -- 发起对话人数（去重）
    COUNT(DISTINCT c.user_id) AS conversations,
    -- 对话轮次总数
    COUNT(c.id) AS dialog_rounds
FROM conversations c, yesterday_range yr
WHERE c.created_at >= yr.start_date
  AND c.created_at < yr.end_date
  AND c.is_user_message = TRUE;

-- 获取昨日生成洞察人数
SELECT COUNT(DISTINCT user_id) AS insights
FROM insights
WHERE generated_at >= CURRENT_DATE - INTERVAL '1 day'
  AND generated_at < CURRENT_DATE;

-- 获取昨日评分人数
SELECT COUNT(DISTINCT user_id) AS ratings
FROM ratings
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND created_at < CURRENT_DATE;

-- 获取转化率
WITH metrics AS (
    SELECT
        (SELECT COUNT(DISTINCT user_id) FROM conversations
         WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') AS conv_users,
        (SELECT COUNT(DISTINCT user_id) FROM insights
         WHERE generated_at >= CURRENT_DATE - INTERVAL '1 day') AS insight_users,
        (SELECT COUNT(DISTINCT user_id) FROM ratings
         WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') AS rating_users
)
SELECT
    ROUND(insight_users * 100.0 / NULLIF(conv_users, 0), 1) AS insight_trigger_rate,
    ROUND(rating_users * 100.0 / NULLIF(insight_users, 0), 1) AS rating_rate
FROM metrics;

-- 获取评分分布（昨日）
WITH rating_counts AS (
    SELECT
        CASE
            WHEN score = 5 THEN 'five'
            WHEN score = 4 THEN 'four'
            WHEN score BETWEEN 1 AND 3 THEN 'low'
        END AS rating_group,
        COUNT(DISTINCT user_id) AS count
    FROM ratings
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND created_at < CURRENT_DATE
    GROUP BY rating_group
),
total_rated AS (
    SELECT SUM(count) AS total FROM rating_counts
)
SELECT
    rc.rating_group,
    rc.count,
    ROUND(rc.count * 100.0 / NULLIF(tr.total, 0), 1) AS percentage
FROM rating_counts rc, total_rated tr;

-- 获取点踩数据（昨日）
WITH dialog_rounds AS (
    SELECT COUNT(*) AS total_rounds
    FROM conversations
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND created_at < CURRENT_DATE
      AND is_user_message = TRUE
)
SELECT
    COUNT(td.id) AS thumbs_down_count,
    COUNT(DISTINCT td.user_id) AS thumbs_down_users,
    ROUND(COUNT(td.id) * 100.0 / NULLIF(dr.total_rounds, 0), 1) AS thumbs_down_rate
FROM thumbs_down td, dialog_rounds dr
WHERE td.created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND td.created_at < CURRENT_DATE;
```

---

### 2. 获取趋势数据

获取核心指标的趋势数据，用于绘制趋势图表。

#### 请求信息

- **URL**: `/api/trends`
- **Method**: `GET`
- **请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 7 | 获取最近N天的数据（支持 7、30 或自定义天数） |

#### 请求示例

```
GET /api/trends?days=14
```

#### 响应格式

> **注意**：数据按日期**升序排列**（从旧到新），便于图表从左到右展示时间线

```json
[
  {
    "date": "2024-01-09",
    "conversations": 1189,
    "insights": 856,
    "dialogRounds": 3654,
    "ratings": 612,
    "insightTriggerRate": "72.0",
    "ratingRate": "71.5"
  },
  {
    "date": "2024-01-10",
    "conversations": 1247,
    "insights": 892,
    "dialogRounds": 3856,
    "ratings": 634,
    "insightTriggerRate": "71.5",
    "ratingRate": "71.1"
  }
  // ... 更多日期数据（按日期升序）
]
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | 日期（格式：YYYY-MM-DD） |
| `conversations` | number | 当日发起对话人数（去重） |
| `insights` | number | 当日生成洞察人数（去重） |
| `dialogRounds` | number | 当日对话轮数（一问一答 = 1轮） |
| `ratings` | number | 当日评分人数（去重） |
| `insightTriggerRate` | string | 洞察触发率（%），字符串格式，保留1位小数 |
| `ratingRate` | string | 评分率（%），字符串格式，保留1位小数 |

#### SQL 参考

```sql
-- 获取最近N天的趋势数据
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '7 days',  -- 根据 days 参数调整
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::DATE AS date
),
daily_conversations AS (
    SELECT
        DATE(created_at) AS date,
        COUNT(DISTINCT user_id) AS conversations,
        COUNT(*) AS dialog_rounds
    FROM conversations
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND is_user_message = TRUE
    GROUP BY DATE(created_at)
),
daily_insights AS (
    SELECT
        DATE(generated_at) AS date,
        COUNT(DISTINCT user_id) AS insights
    FROM insights
    WHERE generated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(generated_at)
),
daily_ratings AS (
    SELECT
        DATE(created_at) AS date,
        COUNT(DISTINCT user_id) AS ratings
    FROM ratings
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
)
SELECT
    ds.date,
    COALESCE(dc.conversations, 0) AS conversations,
    COALESCE(di.insights, 0) AS insights,
    COALESCE(dc.dialog_rounds, 0) AS "dialogRounds",
    COALESCE(dr.ratings, 0) AS ratings,
    COALESCE(
        ROUND(di.insights * 100.0 / NULLIF(dc.conversations, 0), 1)::TEXT,
        '0.0'
    ) AS "insightTriggerRate",
    COALESCE(
        ROUND(dr.ratings * 100.0 / NULLIF(di.insights, 0), 1)::TEXT,
        '0.0'
    ) AS "ratingRate"
FROM date_series ds
LEFT JOIN daily_conversations dc ON ds.date = dc.date
LEFT JOIN daily_insights di ON ds.date = di.date
LEFT JOIN daily_ratings dr ON ds.date = dr.date
ORDER BY ds.date ASC;  -- 升序排列，便于图表展示
```

---

### 3. 获取评分趋势

获取评分分布的趋势数据，用于评分趋势图表。

#### 请求信息

- **URL**: `/api/ratings/trend`
- **Method**: `GET`
- **请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 7 | 获取最近N天的数据（支持 7、30 或自定义天数） |

#### 请求示例

```
GET /api/ratings/trend?days=7
```

#### 响应格式

> **注意**：数据按日期**升序排列**（从旧到新）

```json
[
  {
    "date": "2024-01-09",
    "fiveStar": 432,
    "fourStar": 118,
    "lowStar": 48
  },
  {
    "date": "2024-01-10",
    "fiveStar": 456,
    "fourStar": 123,
    "lowStar": 55
  }
  // ... 更多日期数据（按日期升序）
]
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | 日期（格式：YYYY-MM-DD） |
| `fiveStar` | number | 当日5分评价人数（去重） |
| `fourStar` | number | 当日4分评价人数（去重） |
| `lowStar` | number | 当日低分（1-3分）评价人数（去重） |

> **注意**: 百分比（`fiveStarPct`、`fourStarPct`、`lowStarPct`）由前端计算：
> ```javascript
> const total = item.fiveStar + item.fourStar + item.lowStar
> const fiveStarPct = total > 0 ? ((item.fiveStar / total) * 100).toFixed(1) : 0
> ```

#### SQL 参考

```sql
-- 获取评分趋势数据
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::DATE AS date
),
daily_ratings AS (
    SELECT
        DATE(created_at) AS date,
        COUNT(DISTINCT CASE WHEN score = 5 THEN user_id END) AS five_star,
        COUNT(DISTINCT CASE WHEN score = 4 THEN user_id END) AS four_star,
        COUNT(DISTINCT CASE WHEN score BETWEEN 1 AND 3 THEN user_id END) AS low_star
    FROM ratings
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
)
SELECT
    ds.date,
    COALESCE(dr.five_star, 0) AS "fiveStar",
    COALESCE(dr.four_star, 0) AS "fourStar",
    COALESCE(dr.low_star, 0) AS "lowStar"
FROM date_series ds
LEFT JOIN daily_ratings dr ON ds.date = dr.date
ORDER BY ds.date ASC;  -- 升序排列
```

---

### 4. 获取点踩趋势

获取点踩数据的趋势，用于点踩趋势图表。

#### 请求信息

- **URL**: `/api/thumbsdown/trend`
- **Method**: `GET`
- **请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 7 | 获取最近N天的数据（支持 7、30 或自定义天数） |

#### 请求示例

```
GET /api/thumbsdown/trend?days=30
```

#### 响应格式

> **注意**：数据按日期**升序排列**（从旧到新）

```json
[
  {
    "date": "2024-01-09",
    "count": 76,
    "users": 58,
    "rate": "2.1"
  },
  {
    "date": "2024-01-10",
    "count": 89,
    "users": 67,
    "rate": "2.3"
  }
  // ... 更多日期数据（按日期升序）
]
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | 日期（格式：YYYY-MM-DD） |
| `count` | number | 当日点踩次数（被点踩的 AI 回复数量） |
| `users` | number | 当日点踩人数（去重） |
| `rate` | string | 当日点踩率（%），**字符串格式**，保留1位小数 |

> **注意**：`rate` 字段在趋势接口中返回 string 类型（如 `"2.3"`），但在 `/api/dashboard` 的 `thumbsDown.rate` 中返回 number 类型（如 `2.3`）。后端开发时建议统一为 number 类型。

#### SQL 参考

```sql
-- 获取点踩趋势数据
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::DATE AS date
),
daily_dialog_rounds AS (
    SELECT
        DATE(created_at) AS date,
        COUNT(*) AS total_rounds
    FROM conversations
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND is_user_message = TRUE
    GROUP BY DATE(created_at)
),
daily_thumbs_down AS (
    SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count,
        COUNT(DISTINCT user_id) AS users
    FROM thumbs_down
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE(created_at)
)
SELECT
    ds.date,
    COALESCE(dt.count, 0) AS count,
    COALESCE(dt.users, 0) AS users,
    COALESCE(
        ROUND(dt.count * 100.0 / NULLIF(dr.total_rounds, 0), 1)::TEXT,
        '0.0'
    ) AS rate
FROM date_series ds
LEFT JOIN daily_dialog_rounds dr ON ds.date = dr.date
LEFT JOIN daily_thumbs_down dt ON ds.date = dt.date
ORDER BY ds.date ASC;  -- 升序排列
```

---

### 5. 获取AB对比

获取 A/B 版本的对比数据，支持按时间范围筛选。

#### 请求信息

- **URL**: `/api/ab-comparison`
- **Method**: `GET`
- **请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| days | number | 否 | 1 | 获取最近N天的数据（支持 7、30 或自定义天数） |

#### 请求示例

```
GET /api/ab-comparison?days=7
```

#### 响应格式

```json
{
  "versionA": {
    "conversations": 623,
    "insights": 456,
    "dialogRounds": 1928,
    "ratings": 324,
    "insightTriggerRate": 73.2,
    "ratingRate": 71.1,
    "fiveStar": {
      "count": 234,
      "percentage": 72.2
    },
    "fourStar": {
      "count": 63,
      "percentage": 19.4
    },
    "lowStar": {
      "count": 27,
      "percentage": 8.4
    },
    "unrated": 132,
    "thumbsDownCount": 42,
    "thumbsDownUsers": 31,
    "thumbsDownRate": 2.2
  },
  "versionB": {
    "conversations": 624,
    "insights": 436,
    "dialogRounds": 1928,
    "ratings": 310,
    "insightTriggerRate": 69.9,
    "ratingRate": 71.1,
    "fiveStar": {
      "count": 222,
      "percentage": 71.6
    },
    "fourStar": {
      "count": 60,
      "percentage": 19.4
    },
    "lowStar": {
      "count": 28,
      "percentage": 9.0
    },
    "unrated": 126,
    "thumbsDownCount": 47,
    "thumbsDownUsers": 36,
    "thumbsDownRate": 2.4
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `conversations` | number | 发起对话人数（去重） |
| `insights` | number | 生成洞察人数（去重） |
| `dialogRounds` | number | 对话轮数（一问一答 = 1轮） |
| `ratings` | number | 评分人数（去重） |
| `insightTriggerRate` | number | 洞察触发率（%） |
| `ratingRate` | number | 评分率（%） |
| `fiveStar.count` | number | 5分评价人数 |
| `fiveStar.percentage` | number | 5分占比（%） |
| `fourStar.*` | - | 4分评价数据 |
| `lowStar.*` | - | 低分（1-3分）评价数据 |
| `unrated` | number | 未评分人数 |
| `thumbsDownCount` | number | 点踩次数（被点踩的 AI 回复数量） |
| `thumbsDownUsers` | number | 点踩人数（去重） |
| `thumbsDownRate` | number | 点踩率（%） |

#### SQL 参考

```sql
-- 获取AB对比数据（以A组为例，B组类似，将 ab_group = 'A' 改为 'B'）
-- $days 为请求参数，默认为 1
WITH group_a_users AS (
    SELECT id FROM users WHERE ab_group = 'A'
),
metrics AS (
    SELECT
        -- 发起对话人数
        (SELECT COUNT(DISTINCT c.user_id)
         FROM conversations c
         JOIN group_a_users g ON c.user_id = g.id
         WHERE c.created_at >= CURRENT_DATE - INTERVAL '$days days') AS conversations,

        -- 生成洞察人数
        (SELECT COUNT(DISTINCT i.user_id)
         FROM insights i
         JOIN group_a_users g ON i.user_id = g.id
         WHERE i.generated_at >= CURRENT_DATE - INTERVAL '$days days') AS insights,

        -- 对话轮数（一问一答 = 1轮）
        (SELECT COUNT(*)
         FROM conversations c
         JOIN group_a_users g ON c.user_id = g.id
         WHERE c.created_at >= CURRENT_DATE - INTERVAL '$days days'
           AND c.is_user_message = TRUE) AS dialog_rounds,

        -- 评分人数
        (SELECT COUNT(DISTINCT r.user_id)
         FROM ratings r
         JOIN group_a_users g ON r.user_id = g.id
         WHERE r.created_at >= CURRENT_DATE - INTERVAL '$days days') AS ratings
),
rating_dist AS (
    SELECT
        COUNT(DISTINCT CASE WHEN r.score = 5 THEN r.user_id END) AS five_star,
        COUNT(DISTINCT CASE WHEN r.score = 4 THEN r.user_id END) AS four_star,
        COUNT(DISTINCT CASE WHEN r.score BETWEEN 1 AND 3 THEN r.user_id END) AS low_star
    FROM ratings r
    JOIN group_a_users g ON r.user_id = g.id
    WHERE r.created_at >= CURRENT_DATE - INTERVAL '$days days'
),
thumbs AS (
    SELECT
        COUNT(*) AS thumbs_down_count,
        COUNT(DISTINCT t.user_id) AS thumbs_down_users
    FROM thumbs_down t
    JOIN group_a_users g ON t.user_id = g.id
    WHERE t.created_at >= CURRENT_DATE - INTERVAL '$days days'
)
SELECT
    m.conversations,
    m.insights,
    m.dialog_rounds AS "dialogRounds",
    m.ratings,
    ROUND(m.insights * 100.0 / NULLIF(m.conversations, 0), 1) AS "insightTriggerRate",
    ROUND(m.ratings * 100.0 / NULLIF(m.insights, 0), 1) AS "ratingRate",
    rd.five_star,
    ROUND(rd.five_star * 100.0 / NULLIF(rd.five_star + rd.four_star + rd.low_star, 0), 1) AS five_star_pct,
    rd.four_star,
    ROUND(rd.four_star * 100.0 / NULLIF(rd.five_star + rd.four_star + rd.low_star, 0), 1) AS four_star_pct,
    rd.low_star,
    ROUND(rd.low_star * 100.0 / NULLIF(rd.five_star + rd.four_star + rd.low_star, 0), 1) AS low_star_pct,
    m.insights - m.ratings AS unrated,
    th.thumbs_down_count AS "thumbsDownCount",
    th.thumbs_down_users AS "thumbsDownUsers",
    ROUND(th.thumbs_down_count * 100.0 / NULLIF(m.dialog_rounds, 0), 1) AS "thumbsDownRate"
FROM metrics m, rating_dist rd, thumbs th;
```

---

## 关键计算逻辑

### 1. 洞察触发率（Insight Trigger Rate）

**定义**: 生成洞察的用户占发起对话用户的比例

**公式**:
```
洞察触发率 = (生成洞察用户数 / 发起对话人数) × 100%
```

**SQL 实现**:
```sql
SELECT
    ROUND(
        (SELECT COUNT(DISTINCT user_id) FROM insights WHERE generated_at >= $start_date) * 100.0 /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM conversations WHERE created_at >= $start_date), 0),
        1
    ) AS insight_trigger_rate;
```

---

### 2. 评分率（Rating Rate）

**定义**: 评分用户占生成洞察用户的比例

**公式**:
```
评分率 = (评分用户数 / 生成洞察用户数) × 100%
```

**SQL 实现**:
```sql
SELECT
    ROUND(
        (SELECT COUNT(DISTINCT user_id) FROM ratings WHERE created_at >= $start_date) * 100.0 /
        NULLIF((SELECT COUNT(DISTINCT user_id) FROM insights WHERE generated_at >= $start_date), 0),
        1
    ) AS rating_rate;
```

---

### 3. 点踩率（Thumbs Down Rate）

**定义**: 被点踩的 AI 回复数占总对话轮次的比例

> **说明**：点踩针对单条 AI 回复，一轮对话中 AI 可能有多条回复

**公式**:
```
点踩率 = (点踩次数 / 总对话轮次数) × 100%
```

**SQL 实现**:
```sql
WITH dialog_rounds AS (
    SELECT COUNT(*) AS total
    FROM conversations
    WHERE created_at >= $start_date
      AND is_user_message = TRUE
),
thumbs_count AS (
    SELECT COUNT(*) AS count
    FROM thumbs_down
    WHERE created_at >= $start_date
)
SELECT
    ROUND(tc.count * 100.0 / NULLIF(dr.total, 0), 1) AS thumbs_down_rate
FROM dialog_rounds dr, thumbs_count tc;
```

---

### 4. 评分占比（Rating Percentage）

**定义**: 某一评分等级的用户占所有评分用户的比例

**公式**:
```
评分占比 = (该分数人数 / 评分总人数) × 100%
```

**注意**: 未评分用户不计入占比计算

**SQL 实现**:
```sql
WITH rating_counts AS (
    SELECT
        COUNT(DISTINCT CASE WHEN score = 5 THEN user_id END) AS five_star,
        COUNT(DISTINCT CASE WHEN score = 4 THEN user_id END) AS four_star,
        COUNT(DISTINCT CASE WHEN score BETWEEN 1 AND 3 THEN user_id END) AS low_star
    FROM ratings
    WHERE created_at >= $start_date
),
total AS (
    SELECT five_star + four_star + low_star AS total_rated FROM rating_counts
)
SELECT
    rc.five_star,
    ROUND(rc.five_star * 100.0 / NULLIF(t.total_rated, 0), 1) AS five_star_percentage,
    rc.four_star,
    ROUND(rc.four_star * 100.0 / NULLIF(t.total_rated, 0), 1) AS four_star_percentage,
    rc.low_star,
    ROUND(rc.low_star * 100.0 / NULLIF(t.total_rated, 0), 1) AS low_star_percentage
FROM rating_counts rc, total t;
```

---

## 附录：其他辅助接口

以下接口可根据需要单独调用，用于获取部分数据：

### 获取核心指标

- **URL**: `/api/metrics/core`
- **Method**: `GET`
- **响应**: 返回 `coreMetrics` 部分数据

### 获取转化率指标

- **URL**: `/api/metrics/conversion`
- **Method**: `GET`
- **响应**: 返回 `conversionRates` 部分数据

### 获取评分分布

- **URL**: `/api/ratings`
- **Method**: `GET`
- **响应**: 返回 `ratingDistribution` 部分数据

### 获取点踩数据

- **URL**: `/api/thumbsdown`
- **Method**: `GET`
- **响应**: 返回 `thumbsDown` 部分数据

---

## 业务规则说明

以下为已确认的业务规则定义：

| 规则 | 说明 |
|------|------|
| 对话轮数 | 一问一答 = 1轮 |
| 历史累计起始时间 | 数据面板部署上线时间 |
| 点踩对象 | 针对**单条 AI 回复**，非整轮对话 |
| 评分规则 | 同一用户对同一洞察**只能评分一次**，不允许重复评分 |
| AB 对比时间筛选 | 支持 days 参数（7、30 天或自定义天数） |
| 人数统计 | 所有"人数"类指标均为**去重后**的用户数 |

---

## 已知的代码与文档差异

> 供后端开发参考：

### 数据类型不一致
- `/api/dashboard` 的 `thumbsDown.rate` 返回 `number` 类型
- `/api/thumbsdown/trend` 的 `rate` 返回 `string` 类型
- **建议**：统一为 `number` 类型

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.1.2 | 2024-01-20 | 修复 AB 对比时间选择器功能（前后端均已实现） |
| 1.1.1 | 2024-01-20 | 修正时间选择器参数：7/30天或自定义（移除14天选项） |
| 1.1.0 | 2024-01-20 | 完善业务规则：点踩针对单条AI回复、评分唯一约束、历史累计起始时间 |
| 1.0.2 | 2024-01-20 | AB 对比接口添加 `days` 参数支持；明确对话轮数定义（一问一答=1轮） |
| 1.0.1 | 2024-01-20 | 添加待确认问题、已知差异说明；修正趋势数据排序为升序 |
| 1.0.0 | 2024-01-20 | 初始版本，包含5个核心API接口规范 |

---

*文档生成时间: 2024-01-20*
