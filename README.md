# AI Gateway

商业化 AI API 中转平台。

## 结构

- `backend`：FastAPI、SQLAlchemy、JWT、API Key 与 Gateway
- `frontend`：Next.js 控制台页面
- `database`：PostgreSQL 初始化脚本与数据设计
- `docker`：Nginx 反向代理配置
- `docker-compose.yml`：本地一键启动编排

## 启动

开发环境可直接使用初始化 SQL：

```bash
docker compose up -d
```

生产环境使用版本化迁移：

```bash
cd backend
alembic upgrade head
```

启动前必须在 `backend/.env` 中配置真实的 `JWT_SECRET_KEY`、`API_KEY_PEPPER`、`DATABASE_URL`、`REDIS_URL` 和 `VOVOAPI_API_KEY`。

## API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `POST /api/v1/api-keys`
- `GET /api/v1/usage`
- `POST /v1/chat/completions`

Gateway 使用 `Authorization: Bearer sk-user-...`，网站管理接口使用 JWT Bearer Token。