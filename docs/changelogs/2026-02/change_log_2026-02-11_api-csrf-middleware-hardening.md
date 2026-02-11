# Change Log — 2026-02-11

## Summary
新增 API 层 CSRF 防护（基于 Origin/Referer 校验），并将其接入全局 middleware；同时补充测试与文档。

## Changes

### Added
- 新增 CSRF 校验工具：`src/lib/csrf.ts`
- 新增 CSRF 回归测试：`src/__tests__/csrfProtection.test.ts`
- middleware 新增 API 写操作的 CSRF 校验逻辑（`POST/PUT/PATCH/DELETE`）

### Modified
- `src/middleware.ts`
  - middleware 现在覆盖 API 路由（静态资源仍排除）
  - 新增豁免路径：`/api/cron`、`/api/health`、`/api/payments/tng/callback`
  - 支持 `CSRF_TRUSTED_ORIGINS` 额外可信来源
- `src/lib/csrf.ts`
  - 对带 `Authorization: Bearer ...` 的机器调用放行，避免误拦截服务间请求
- `docs/guides/ENVIRONMENT_SETUP.md`
  - 新增环境变量 `CSRF_TRUSTED_ORIGINS` 说明与示例
- `docs/guides/MIDDLEWARE.md`
  - 更新 matcher、API 覆盖行为与 CSRF 流程说明

### Fixed
- 修复“全局 API 缺少 CSRF 防护”风险（对状态变更请求提供统一校验）。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/csrf.ts` | Added | Origin/Referer 校验与豁免路径机制 |
| `src/middleware.ts` | Modified | 接入 API CSRF 校验并扩展 matcher |
| `src/__tests__/csrfProtection.test.ts` | Added | 覆盖同源、跨域、缺失来源、豁免路径与信任域名场景 |
| `docs/guides/ENVIRONMENT_SETUP.md` | Modified | 新增 `CSRF_TRUSTED_ORIGINS` 变量文档 |
| `docs/guides/MIDDLEWARE.md` | Modified | 同步最新 middleware 行为与 CSRF 规则 |

## API Changes
- 非 GET/HEAD/OPTIONS API 请求在来源校验失败时返回 `403`：
  - `message: "CSRF validation failed"`
  - `reason: "missing_origin" | "invalid_origin" | "origin_mismatch"`

## Database Changes
- 无

## Testing
- [x] 类型检查通过（`npm run type-check`）
- [x] Lint 检查通过（`npm run lint`，存在既有 warning）
- [x] 测试通过（`npm run test:run`）
- [x] 构建成功（`npm run build`）
