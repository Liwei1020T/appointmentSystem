# Change Log — 2026-02-11

## Summary
优化了 `npm run build` 在项目中的“长时间卡住”问题，收敛上传工具的路径解析范围并补充回归测试，同时清理了工作区内非 `.git` 的 AppleDouble 元数据文件（`._*`）。

## Changes

### Added
- 新增上传路径归一化测试：`normalizeStoredUploadPath`。

### Modified
- 调整 `src/lib/upload.ts` 路径处理逻辑：
- 新增 `normalizeStoredUploadPath`，统一处理 `uploads` 前缀、前导斜杠和 Windows 反斜杠。
- `deleteFile` 与 `getFileInfo` 改为仅基于 upload 根目录解析绝对路径，避免从项目根目录进行宽范围解析。
- `saveFile` 的 folder 规范化改为复用统一路径归一化逻辑。

### Fixed
- 减少 Next.js output file tracing 膨胀风险，缓解 build 过程中 `Creating an optimized production build ...` 长时间无输出的体感卡顿。
- 清理了工作区内（排除 `.git`）`._*` 元数据文件，避免对构建与扫描造成额外负担。

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/lib/upload.ts` | Modified | 收敛上传相关路径解析范围，避免 project-root 级别动态解析 |
| `src/__tests__/uploadPathNormalization.test.ts` | Added | 上传路径归一化回归测试 |
| `docs/changelogs/2026-02/change_log_2026-02-11_build-hang-trace-optimization.md` | Added | 本次变更记录 |

## API Changes
无对外 API 契约变更。

## Database Changes
无数据库 schema 变更。

## Testing
- [x] 类型检查通过 (`npm run type-check`)
- [x] Lint 检查通过 (`npm run lint`)
- [x] 测试通过 (`npm run test:run`)
- [ ] 构建成功 (`npm run build`) - 当前环境外网受限，`next/font/google` 无法访问 `fonts.googleapis.com`
