# Config Module

这份说明只描述当前后端配置模块的真实实现，不再沿用旧模板里已经不存在的配置域。

## 当前职责

- 定义配置键：`config-key.enum.ts`
- 读取根级环境文件：`../../.env.${NODE_ENV}` 和 `../../.env`
- 用 Joi 校验启动时的环境变量
- 通过 `ConfigService` 暴露统一访问入口

## 当前覆盖的配置域

- App
  - `NODE_ENV`
  - `PORT`
  - `ENABLE_SWAGGER`
  - `FRONTEND_HOST`
- Database
  - `DATABASE_URL`
  - `POSTGRES_*`
- Redis
  - `REDIS_URL`
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_PASSWORD`
- Auth
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`

## 当前实现细节

1. `ConfigModule.forRoot()` 在 `AppModule` 中注册为全局模块
2. Joi schema 位于 `validation.schema.ts`
3. 配置工厂位于 `app.config.ts`
4. 各业务模块通过 `ConfigService.get()` 或 `getOrThrow()` 读取配置

## 已知问题

- 配置键是 `FRONTEND_HOST`，但 `app.config.ts` 当前读取的是 `process.env.HOST`
- 这会导致文档中声明的 `FRONTEND_HOST` 与实际行为不完全一致

## 使用示例

```ts
const port = configService.get<number>(ConfigKey.PORT);
const jwtSecret = configService.getOrThrow<string>(ConfigKey.JWT_SECRET);
```
