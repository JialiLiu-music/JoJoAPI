# 数据库设计

## 数据流

```text
users
  ├── api_keys       用户凭证
  ├── usage_records  调用审计与计费依据
  └── payments       充值订单

model_prices         provider + model 的计费配置
```

## 约束

- `users.email` 唯一，作为登录标识。
- `api_keys.key_hash` 唯一；完整 API Key 不落库，只在创建时返回一次。
- `api_keys` 使用软撤销，`status=revoked` 后保留审计关联。
- `usage_records` 保存请求、token、费用和失败原因，支持按用户与时间倒序查询。
- `model_prices` 使用 `(provider, model)` 唯一约束，避免同一模型存在多套生效价格。
- 金额使用 `NUMERIC`，不使用浮点数，避免计费精度损失。

## 迁移策略

开发环境可由 SQLAlchemy `create_all` 创建基础表；生产环境必须使用版本化迁移，避免启动时隐式修改结构。`database/init.sql` 仅用于 PostgreSQL 初始实例和结构参考。

## 计费事务边界

```text
provider 返回 usage
  ↓
开启数据库事务
  ↓
锁定用户余额
  ↓
校验余额与最终 cost
  ↓
扣减 balance
  ↓
写入 usage_records
  ↓
提交事务
```

上游调用失败不扣费，但仍应写入 `usage_records.status=failed`，用于排障和审计。