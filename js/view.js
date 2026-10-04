/* solar-syst · 视角拖拽（渐进增强）
   鼠标拖拽 / 触屏拖拽 / 滚轮与双指缩放 —— 统一走 Pointer Events。
   删除本文件后页面自动退回 CSS 里的静态视角，公转动画与数据卡均不受影响。 */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  var DEG = 0.3;        // 灵敏度：像素 → 度
  var MAX_PITCH = 88;   // 俯仰上限，避免翻到背面
  var TAP_SLOP = 8;     // 位移小于它就判定为「点按」，不转视角
  var MIN_ZOOM = 0.4;
  var MAX_ZOOM = 3;

  var yaw = 0, pitch = 0, zoom = 1;
  var drag = null;
  var pinch = null;
  var pts = {};
  var focusDuringDrag = false;   // 本次拖拽是否顺带把焦点（选中）带到了某个天体上
  var lastTapTime = 0, lastTapX = 0, lastTapY = 0;   // 触屏双击检测（移动端 dblclick 不触发）

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function apply() {
    root.style.setProperty('--yaw', yaw.toFixed(2) + 'deg');
    root.style.setProperty('--pitch', pitch.toFixed(2) + 'deg');
    root.style.setProperty('--zoom', zoom.toFixed(3));
  }

  /* 监听 document：这样在说明面板、信息卡上方按下也能拖动 */
  document.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;   // 只响应主键
    pts[e.pointerId] = e;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch, moved: 0 };
    focusDuringDrag = false;
    body.classList.add('is-dragging');
  });

  document.addEventListener('pointermove', function (e) {
    if (pts[e.pointerId]) { pts[e.pointerId] = e; }

    /* 双指缩放 */
    var ids = Object.keys(pts);
    if (ids.length === 2) {
      var a = pts[ids[0]], b = pts[ids[1]];
      var d = Math.sqrt(Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2));
      if (!pinch) {
        pinch = { d: d, zoom: zoom };
        drag = null;                    // 双指时取消旋转，避免打架
      } else {
        zoom = clamp(pinch.zoom * (d / pinch.d), MIN_ZOOM, MAX_ZOOM);
        apply();
      }
      return;
    }

    /* 单指 / 鼠标拖拽 */
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if (drag.moved <= TAP_SLOP) return;   // 还没超过阈值 → 当成点按
    yaw = drag.yaw + dx * DEG;
    pitch = clamp(drag.pitch - dy * DEG, -MAX_PITCH, MAX_PITCH);
    apply();
  });

  function endDrag(e) {
    delete pts[e.pointerId];
    if (Object.keys(pts).length < 2) { pinch = null; }

    if (drag && e.pointerId === drag.id) {
      /* 只有「拖拽过程中顺手聚焦到某颗星球」才清掉焦点；
         否则会把用户从列表里选中的天体一起清掉（选中 = 聚焦） */
      if (drag.moved > TAP_SLOP && focusDuringDrag &&
          document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      /* 触屏点一下（没拖动）时检测双击，移动端 dblclick 不会触发 */
      if (drag.moved <= TAP_SLOP && e.pointerType === 'touch') {
        detectDoubleTap(e);
      }
      drag = null;
    }

    /* 只要没有指针还按着就一定要收尾。
       双指缩放时 drag 已被置空，走不到上面的分支 —— 若不在这里兜底，
       body.is-dragging 会永远留着，导致数据卡再也弹不出来。 */
    if (Object.keys(pts).length === 0) {
      pinch = null;
      body.classList.remove('is-dragging');
    }
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  /* 指针移出窗口：直接收尾，避免在窗口外松手后状态卡住
     （没用 setPointerCapture —— 它会把 click 重定向到 body，导致点按天体无法聚焦、数据卡失效） */
  document.addEventListener('pointerleave', endDrag);

  /* 移动端双击空白处复位（桌面端用下面的 dblclick） */
  function detectDoubleTap(e) {
    var now = Date.now();
    if (now - lastTapTime < 300 &&
        Math.abs(e.clientX - lastTapX) < 40 && Math.abs(e.clientY - lastTapY) < 40) {
      yaw = 0; pitch = 0; zoom = 1; apply();
      lastTapTime = 0;
    } else {
      lastTapTime = now; lastTapX = e.clientX; lastTapY = e.clientY;
    }
  }

  /* 双击 / 双击触摸复位 */
  document.addEventListener('dblclick', function () {
    yaw = 0; pitch = 0; zoom = 1;
    apply();
  });

  /* 兜底：切走标签页 / 窗口失焦时强制复位，防止 is-dragging 卡死 */
  window.addEventListener('blur', function () {
    pts = {};
    drag = null;
    pinch = null;
    body.classList.remove('is-dragging');
  });

  /* ── 左侧天体列表 ⇄ 右侧天体 联动 ──────────────────────────
     选中状态复用已有的 :focus 通道（轨道 div 带 tabindex），
     所以数据卡、高亮全部沿用现成 CSS，这里只负责「点列表 → 聚焦 + 同步列表高亮」。 */
  var legend = document.querySelector('.legend');
  var items = legend ? Array.prototype.slice.call(legend.querySelectorAll('[data-target]')) : [];

  function setActive(name) {
    items.forEach(function (btn) {
      btn.classList.toggle('is-active', !!name && btn.getAttribute('data-target') === name);
    });
  }

  items.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-target');
      var el = document.getElementById(name);
      if (el) { el.focus({ preventScroll: true }); }
      setActive(name);
    });
  });

  /* 焦点变化 → 同步列表高亮（直接点按 / Tab 到某颗天体时同样生效） */
  document.addEventListener('focusin', function (e) {
    var t = e.target;
    if (t && t.dataset && t.dataset.name) { setActive(t.dataset.name); }
    if (drag) { focusDuringDrag = true; }
  });
  document.addEventListener('focusout', function () {
    window.setTimeout(function () {
      var a = document.activeElement;
      var inLegend = a && a.closest && a.closest('.legend');
      if (!a || (!a.dataset.name && !inLegend)) { setActive(null); }
    }, 0);
  });

  /* 滚轮缩放 */
  document.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoom = clamp(zoom * (e.deltaY > 0 ? 0.92 : 1.08), MIN_ZOOM, MAX_ZOOM);
    apply();
  }, { passive: false });

  apply();
})();
