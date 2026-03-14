# 密钥存储管理系统

一个安全、现代化的密钥存储和管理系统，用于保存 API Key、密码等敏感信息。

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.0-green?logo=python)](https://fastapi.tiangolo.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://www.javascript.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ 功能特性

- 🔐 **用户认证**: 用户注册和登录，JWT Token 认证
- 🔒 **加密存储**: 使用 PBKDF2 + AES-256-GCM 加密所有密钥数据
- 🛡️ **密码验证**: 查看密钥时需要重新输入密码确认
- 📝 **完整的 CRUD**: 创建、读取、更新、删除密钥
- 🎨 **现代化 UI**: 响应式设计，支持深色/浅色主题切换
- 🌏 **中文界面**: 完整的中文本地化支持
- 📱 **移动端友好**: 响应式布局，支持各种设备

## 🏗️ 项目结构

```
secret-store/
├── backend/
│   ├── main.py                 # FastAPI 主入口和路由
│   ├── models.py               # SQLAlchemy 数据库模型
│   ├── schemas.py              # Pydantic 请求/响应模型
│   ├── auth.py                 # JWT 认证逻辑
│   ├── crypto.py               # 加密/解密模块
│   ├── database.py             # SQLite 数据库连接
│   ├── requirements.txt        # Python 依赖
│   └── secrets.db              # SQLite 数据库文件（运行后生成）
├── frontend/
│   ├── index.html              # 登录/注册页面
│   ├── dashboard.html          # 密钥管理主页面
│   ├── dashboard.css           # 样式文件（独立）
│   ├── api.js                  # API 请求封装
│   ├── login.js                # 登录/注册逻辑
│   └── dashboard.js            # 密钥管理逻辑
├── .gitignore                   # Git 忽略文件配置
├── docker-compose.yml          # Docker Compose 配置
├── Dockerfile                   # Docker 镜像配置
├── Makefile                    # Make 命令快捷方式
└── README.md                   # 项目说明文档（本文件）
```

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

#### 1. 环境要求

- Docker (版本 20.10 或更高)
- Docker Compose (版本 2.0 或更高)

#### 2. 配置环境变量

```bash
# 克隆项目
git clone <repository-url>
cd secret-store

# 生成安全的密钥
make key-gen
```

编辑生成的 `.env` 文件，确认配置正确。

#### 3. 启动服务

```bash
# 使用 Makefile（推荐）
make up

# 或直接使用 docker-compose
docker-compose up -d
```

#### 4. 访问应用

打开浏览器访问: **http://localhost:8080**

#### 5. 常用命令

```bash
make help        # 显示所有可用命令
make logs        # 查看日志
make restart     # 重启服务
make backup      # 备份数据库
make down        # 停止服务
make clean       # 清理容器和镜像
```

### 方式二：本地开发

#### 1. 环境要求

- Python 3.8+
- 现代浏览器（Chrome, Firefox, Safari, Edge）

#### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 3. 启动后端服务

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动

#### 4. 启动前端服务

```bash
cd frontend
python -m http.server 8080
```

然后访问 http://localhost:8080

## 📖 使用指南

### 注册和登录

1. **注册账号**
   - 用户名至少 3 个字符
   - 密码至少 6 个字符
   - 注册成功后自动跳转到登录页面

2. **登录系统**
   - 使用注册的用户名和密码登录
   - 登录成功后进入密钥管理界面

### 密钥管理

#### 1. 添加密钥

1. 点击右上角的"添加密钥"按钮
2. 填写密钥信息：
   - **名称**: 密钥的标识（如 "API Key"、"数据库密码"）
   - **密钥内容**: 实际的密钥值（如 "sk-1234567890"）
   - **备注**: 可选的说明信息
   - **您的密码**: 用于加密的密码
3. 点击"添加密钥"保存

#### 2. 查看密钥

1. 点击密钥列表中的"查看"按钮
2. 输入密码进行身份验证
3. 查看解密后的密钥内容

#### 3. 编辑密钥

1. 点击密钥列表中的"编辑"按钮
2. 输入密码验证身份
3. 修改密钥信息
4. 点击"更新"保存更改

#### 4. 删除密钥

1. 点击密钥列表中的"删除"按钮
2. 确认删除操作
3. 密钥将被永久删除

### 主题切换

点击右上角的太阳/月亮图标可在深色主题和浅色主题之间切换。

## 🔐 安全架构

### 加密方案

1. **密码存储**: 使用 bcrypt 哈希算法存储用户密码（work factor = 12）
2. **密钥派生**: 使用 PBKDF2-HMAC-SHA256 派生加密密钥
   - 迭代次数：100,000 次
   - 每个用户独立的随机盐值
3. **数据加密**: 使用 AES-256-GCM 认证加密
   - 96-bit 随机 Nonce
   - 128-bit 认证标签
4. **传输安全**: JWT Token 认证，Bearer Token 传输

### 数据流程

#### 创建密钥流程

```
用户输入密钥
    ↓
前端传输（HTTPS）
    ↓
后端接收，验证 JWT Token
    ↓
使用 PBKDF2 派生加密密钥（用户密码哈希 + 盐值）
    ↓
使用 AES-256-GCM 加密密钥内容
    ↓
存储加密数据到数据库
```

#### 查看密钥流程

```
用户点击查看
    ↓
输入密码进行验证
    ↓
后端验证用户密码
    ↓
使用相同的密钥派生过程生成解密密钥
    ↓
使用 AES-256-GCM 解密数据
    ↓
返回明文密钥内容
```

### 安全特性

- ✅ 所有密钥数据加密存储
- ✅ 查看密钥需要密码验证
- ✅ 每个用户独立的加密密钥
- ✅ 强密码哈希（bcrypt）
- ✅ JWT Token 认证
- ✅ 自动 Token 过期机制

## 🛠️ 技术栈

### 后端
- **FastAPI 0.104.0**: 现代高性能 Web 框架
- **SQLAlchemy**: Python SQL 工具包和 ORM
- **SQLite**: 轻量级关系数据库
- **PyCryptodome**: 加密库
- **Bcrypt**: 密码哈希
- **Python-Jose**: JWT 处理
- **Uvicorn**: ASGI 服务器

### 前端
- **原生 JavaScript (ES6+)**: 无框架依赖
- **自定义 CSS**: 独立样式文件
- **Fetch API**: HTTP 请求
- **响应式设计**: 移动端友好
- **现代 CSS 特性**: CSS Grid、Flexbox、CSS 变量

### DevOps
- **Docker**: 容器化部署
- **Docker Compose**: 多容器编排
- **Makefile**: 命令快捷方式

## 📡 API 接口

### 认证接口

#### POST /api/auth/register
注册新用户

**请求体**:
```json
{
  "username": "string (min 3 chars)",
  "password": "string (min 6 chars)"
}
```

**响应**: 200 OK
```json
{
  "message": "User created successfully"
}
```

#### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**: 200 OK
```json
{
  "access_token": "eyJ0eXAiOiJ...",
  "token_type": "bearer"
}
```

#### GET /api/auth/me
获取当前用户信息

**请求头**: `Authorization: Bearer <token>`

**响应**: 200 OK

### 密钥管理接口

#### GET /api/secrets
获取当前用户的所有密钥列表

**请求头**: `Authorization: Bearer <token>`

**响应**: 200 OK
```json
[
  {
    "id": 1,
    "name": "API Key",
    "created_at": "2025-03-14T12:00:00.000000"
  }
]
```

#### POST /api/secrets
创建新密钥

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "name": "string",
  "content": "string",
  "note": "string (optional)",
  "password": "string"
}
```

**响应**: 200 OK
```json
{
  "id": 1,
  "name": "API Key",
  "created_at": "2025-03-14T12:00:00.000000"
}
```

#### POST /api/secrets/{id}/reveal
查看密钥内容（需要密码验证）

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "password": "string"
}
```

**响应**: 200 OK
```json
{
  "id": 1,
  "name": "API Key",
  "content": "sk-1234567890",
  "note": "Production API key",
  "created_at": "2025-03-14T12:00:00.000000"
}
```

#### PUT /api/secrets/{id}
更新密钥

**请求头**: `Authorization: Bearer <token>`

**请求体**:
```json
{
  "name": "string (optional)",
  "content": "string (optional)",
  "note": "string (optional)",
  "password": "string"
}
```

**响应**: 200 OK
```json
{
  "id": 1,
  "name": "Updated API Key",
  "created_at": "2025-03-14T12:00:00.000000"
}
```

#### DELETE /api/secrets/{id}
删除密钥

**请求头**: `Authorization: Bearer <token>`

**响应**: 200 OK
```json
{
  "message": "Secret deleted successfully"
}
```

## 🔧 开发说明

### 前端开发

前端采用原生 JavaScript 开发，文件结构清晰：

- **api.js**: 封装所有 API 请求
- **dashboard.js**: 密钥管理页面逻辑
- **login.js**: 登录注册页面逻辑
- **dashboard.css**: 所有样式定义

### 样式系统

使用 CSS 变量定义主题颜色，支持深色/浅色主题切换：

- 深色主题：赛博朋克风格，青色/粉色高光
- 浅色主题：简洁专业，蓝色主色调

### 时区处理

所有时间显示自动转换为上海时区（UTC+8）。

## ⚠️ 安全注意事项

### 生产环境部署

1. **环境变量**:
   - 修改 `SECRET_KEY` 为强随机值（至少 32 字节）
   - 使用强密码策略
   - 定期轮换密钥

2. **HTTPS**:
   - 必须启用 HTTPS
   - 配置有效的 SSL 证书

3. **数据库**:
   - 考虑使用 PostgreSQL 或 MySQL 替代 SQLite
   - 定期备份数据库

4. **限流**:
   - 添加 API 请求频率限制
   - 防止暴力破解攻击

5. **日志**:
   - 启用访问日志记录
   - 监控异常访问

### 数据备份

```bash
# 备份数据库
make backup

# 备份文件会保存到 backups/ 目录
# 文件名格式: secrets_YYYYMMDD_HHMMSS.db
```

## 🎯 路线图

- [x] 用户认证系统
- [x] 密钥 CRUD 操作
- [x] 密钥加密存储
- [x] 密码验证机制
- [x] 响应式 UI 设计
- [x] 深色/浅色主题切换
- [x] 中文本地化
- [x] 时区转换（上海时区）
- [ ] 密钥分类/标签
- [ ] 密钥导入/导出（加密）
- [ ] 两步验证（2FA）
- [ ] 密钥共享功能
- [ ] 操作日志审计
- [ ] 密钥过期提醒
- [ ] 支持文件附件
- [ ] 团队协作功能

## 📝 更新日志

### v1.1.0 (2025-03-14)
- ✨ 分离 CSS 到独立文件
- 🎨 添加深色/浅色主题切换功能
- 🌏 完整的中文界面本地化
- 🕐 时区转换（UTC → 上海时区）
- 🐛 修复添加密钥时的错误提示
- 🐛 修复登录时错误提示不显示中文的问题

### v1.0.0
- 🎉 初始版本发布
- ✅ 用户认证系统
- ✅ 密钥 CRUD 操作
- ✅ PBKDF2 + AES-256-GCM 加密
- ✅ Docker 部署支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

如有问题或建议，欢迎提交 Issue。

---

⚡ **安全提示**: 本系统仅用于管理个人密钥，请勿用于非法用途。请妥善保管您的密码，不要在不信任的环境中使用。
