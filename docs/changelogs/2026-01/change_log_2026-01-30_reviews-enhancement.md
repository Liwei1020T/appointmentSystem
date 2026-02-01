# Change Log — 2026-01-30

## Summary

增强评价系统，添加"全部评价" Tab、点赞功能、排序筛选功能，让用户可以查看和互动所有公开评价。

## Changes

### Added
- 评价页面新增"全部评价" Tab，显示所有用户的公开评价
- ReviewCard 组件添加点赞功能（心形按钮）
- 全部评价支持按时间/评分/点赞数排序
- 全部评价支持按评分（1-5星）筛选
- API 返回 `isLiked` 字段，显示当前用户是否已点赞
- API 返回 `summary.byRating` 字段，用于筛选按钮显示数量

### Modified
- `GET /api/reviews/public` - 添加 sort、rating、page、limit 参数支持
- `ReviewCard` - 添加 showLikeButton 和 onLikeChange props
- `MyReviewsPage` - 从两个 Tab 改为三个 Tab（全部评价/已提交/待评价）
- `reviewService.ts` - 添加 toggleReviewLike 方法和增强 getPublicReviews

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/app/api/reviews/public/route.ts` | Modified | 添加排序、筛选、分页参数支持 |
| `src/server/services/review.service.ts` | Modified | 扩展 getPublicReviews 函数支持新参数 |
| `src/services/reviewService.ts` | Modified | 添加点赞方法和增强的公开评价获取 |
| `src/components/ReviewCard.tsx` | Modified | 添加点赞按钮和交互逻辑 |
| `src/features/reviews/MyReviewsPage.tsx` | Modified | 添加"全部评价" Tab 和筛选排序功能 |
| `docs/plans/2026-01-30-reviews-enhancement-design.md` | Added | 设计文档 |

## API Changes

### GET /api/reviews/public

**新增参数：**
- `sort`: 'latest' | 'rating' | 'likes' (默认: 'latest')
- `rating`: 1-5 (可选，筛选评分)
- `page`: number (默认: 1)
- `limit`: number (默认: 10，最大: 50)

**新增响应字段：**
```json
{
  "reviews": [{
    "isLiked": true,
    "likesCount": 12
  }],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "totalPages": 4
  },
  "summary": {
    "total": 32,
    "byRating": { "5": 20, "4": 8, "3": 2, "2": 1, "1": 1 }
  }
}
```

## Database Changes

无 - 使用现有的 Review.likesCount 和 ReviewLike 模型。

## Testing

- [x] TypeScript 类型检查通过
- [x] ESLint 检查通过
- [x] 构建成功

## Notes

- 点赞功能后端已完整实现，本次仅添加前端 UI
- 用户不能给自己的评价点赞
- 未登录用户可看到点赞数，点击提示登录
- 匿名评价显示"匿名用户"，完全隐藏用户信息
