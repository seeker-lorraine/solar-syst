# solar-syst v1.1.0

优化与美化更新 ✨

## 🐛 Bug 修复

- **冥王星轨道圆心偏移**：`margin-top/-left` 由 `-450px / -320px` 修正为 `-390px / -390px`，轨道终于与太阳同心。
- **404 小屏适配失效**：媒体查询里的 `.container-404` 在 HTML 中并不存在，已改为 `.container-title`，小屏不再溢出。
- **404 星空 30 条死规则**：`.star-2:before` 缺少基础定义导致 30 条 `nth-of-type` 规则全部不渲染，已与 `.star-1:before` 合并。
- **404 倒计时不可见**：倒计时元素包在 `display:none` 容器里，现已显示在页面上；同时 `setInterval("refer()")` 改为 `setInterval(refer, 1000)`。
- **非法嵌套**：`<a><button>` 改为语义化的 `<a class="btn">`。

## 🎨 视觉

- 主页面新增标题 + 说明 + 九大天体图例面板
- 行星改为 `radial-gradient` 球体光照；太阳增加日冕呼吸动画
- 悬停行星：本体放大 + 光晕 + 轨道线提亮；轨道线按行星色相着色
- 星空拆成两层，以不同节奏明暗交替，并以太阳为中心
- 404：数字加金属渐变、按钮改毛玻璃、月亮新增 `Zzz` 打鼾气泡、倒计时可见

## ⚡ 性能与工程化

- 全局调速收敛为 `:root` 的 `--earth-year`，各周期用 `calc()` 换算
- 轨道 div 加 `will-change: transform` / `backface-visibility`，减少大圆环重绘
- 新增 `--scale` 响应式缩放（≤1100 / 900 / 640 / 420px 四档）
- 两个页面均支持 `prefers-reduced-motion`
- `index.html` 移除未使用的 Google Fonts 与 Font Awesome 外链，补充 viewport / description / favicon
- `404.html` 的 `@import` 改为 `preconnect` + `<link … display=swap>`

---

**Full Changelog**: https://github.com/seeker-lorraine/solar-syst/commits/v1.1.0