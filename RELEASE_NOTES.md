# solar-syst v1.2.1

360° 视角拖拽旋转太阳系 🔭

## ✨ 特性

- **360° 视角拖拽**：按住拖动即可任意旋转 / 俯仰整个太阳系，滚轮或双指缩放，双击（移动端双指轻点两下）复位。统一使用 Pointer Events，桌面鼠标与移动端触屏同一套逻辑。
- **星球 billboard**：通过 `@keyframes billboard` 抵消「轨道自转 + 视角旋转」，让星球始终正对镜头保持圆形；轨道线仍会正常随视角倾斜成椭圆。
- **渐进增强，删掉也不坏**：视角交互单独放在 `js/view.js`，删除后页面自动退回 CSS 里的静态视角，公转动画与数据卡完全不受影响。

## 🐛 修复（v1.2.1）

- **移动端天体变形**：修复苹果 / Pixel 等移动端拖拽旋转后天体被压扁成椭圆、立体感消失的问题，确保 billboard 始终生效，星球保持正圆。
- **移动端双击复位失效**：修复移动端双击空白处无法复位视角的问题 —— 改用触屏双击检测（移动端 `dblclick` 不触发），与桌面端 `dblclick` 统一复位。

## 📝 说明

- 视角拖拽会给 `html/body` 加 `touch-action: none`（否则移动端浏览器手势会抢事件），因此移动端缩放改由脚本内的双指缩放实现。
- 拖拽状态有多重兜底清理（`pointerup` / `pointercancel` / `pointerleave` / 窗口 `blur`），不会因双指缩放或在窗口外松手而卡住。

---

**Full Changelog**: https://github.com/seeker-lorraine/solar-system/compare/v1.2.0...v1.2.1
