# JoJoapi

商业化 AI API 中转平台。

## 结构

- `backend`：FastAPI、SQLAlchemy、JWT、API Key 与 Gateway
- `frontend`：Next.js 控制台页面
- `database`：PostgreSQL 初始化脚本与数据设计
- `docker`：Nginx 反向代理配置
- `docker-compose.yml`：本地一键启动编排

## 本地启动

首次启动前复制环境变量模板：

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

然后配置 `backend/.env` 中的上游 API：

```text
VOVOAPI_BASE_URL=你的上游 API 地址
VOVOAPI_API_KEY=你的上游 API Key
```

使用 Docker Compose 启动整站：

```bash
docker compose up -d --build
```

访问入口：

- 网站控制台：http://localhost
- 后端健康检查：http://localhost/api/v1/platform/health 或 http://localhost/health
- OpenAI 兼容转发接口：http://localhost/v1/chat/completions

## 生产部署

生产环境不要直接使用 `.env.example`。至少需要替换以下变量：

```text
APP_ENV=production
CORS_ORIGINS=https://你的域名
JWT_SECRET_KEY=至少 32 位随机字符串
API_KEY_PEPPER=另一段至少 32 位随机字符串
DATABASE_URL=你的 PostgreSQL 连接串
REDIS_URL=你的 Redis 连接串
VOVOAPI_BASE_URL=真实上游 API 地址
VOVOAPI_API_KEY=真实上游 API Key
```

前端如果和 Nginx 同域部署，保持默认即可：

```text
NEXT_PUBLIC_API_BASE_URL=/api
```

如果前端单独部署到 Vercel/Netlify，则改成你的后端公开地址：

```text
NEXT_PUBLIC_API_BASE_URL=https://你的 API 域名/api
```

生产数据库建议使用版本化迁移：

```bash
cd backend
alembic upgrade head
```

## API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `POST /api/v1/api-keys`
- `GET /api/v1/usage`
- `POST /v1/chat/completions`

Gateway 使用 `Authorization: Bearer sk-user-...`，网站管理接口使用 JWT Bearer Token。