# Shared Package

`packages/shared` 是前后端共享契约的单一来源。项目级说明请先看根目录 [README.md](../../README.md)。

## 当前导出内容

- `LoginDto`
- `RegisterDto`
- `AuthResponseDto`
- `UserDto`
- `UpdateUserDto`
- `UserRole`

## 为什么需要它

- 避免前端和后端各写一份接口结构
- 让 Swagger、后端校验和前端类型提示尽量共用一套定义
- 把“接口长什么样”从业务实现里抽出来

## 常用命令

```bash
npm run build -w packages/shared
npm run lint -w packages/shared
```

## 使用方式

```ts
import {LoginDto, RegisterDto, UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
```

## 当前边界

- 这里放“契约”，不放前端组件或后端 service
- 如果某个类型只在单个 workspace 内部使用，不应默认塞进 shared
