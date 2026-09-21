// Shared touch-to-mouse adapter for engines that interact via onMouseDown/Move/Up.
// Bridges touch events onto the engine's existing mouse handlers with single-finger
// tracking, pinch-to-zoom (→ onWheel), long-press (→ onContextMenu), and
// destroy-time cleanup.

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10; // CSS px of drift before cancelling

export function attachTouchBridge(engine, canvas) {
  if (!canvas) return;
  engine.activeTouchId = null;
  engine.previousTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = 'none';

  const position = (touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * canvas.width / rect.width,
      y: (touch.clientY - rect.top) * canvas.height / rect.height,
      rawX: touch.clientX - rect.left,
      rawY: touch.clientY - rect.top,
      button: 0
    };
  };

  // -- pinch state (runs alongside the primary drag, never cancels it) --------
  let pinchPrevDist = 0;
  let pinching = false;

  const pinchDistance = (touches) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // -- long-press state -------------------------------------------------------
  let longPressTimer = null;
  let longPressFired = false;
  let longPressOrigin = null;

  const clearLongPress = () => {
    if (longPressTimer !== null) { clearTimeout(longPressTimer); longPressTimer = null; }
  };

  // -- event handlers ---------------------------------------------------------

  engine.touchStart = (event) => {
    if (event.cancelable) event.preventDefault();

    // Begin pinch tracking when a second finger arrives — but do NOT cancel
    // the primary drag (activeTouchId stays set).
    if (event.touches.length >= 2) {
      clearLongPress();
      pinchPrevDist = pinchDistance(event.touches);
      pinching = true;
      return;
    }

    if (engine.activeTouchId !== null) return;
    const touch = event.changedTouches[0];
    engine.activeTouchId = touch.identifier;
    longPressFired = false;
    longPressOrigin = { x: touch.clientX, y: touch.clientY };

    clearLongPress();
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      longPressFired = true;
      if (engine.onContextMenu) engine.onContextMenu(position(touch));
    }, LONG_PRESS_MS);

    if (engine.onMouseDown) engine.onMouseDown(position(touch));
  };

  engine.touchMove = (event) => {
    if (event.cancelable) event.preventDefault();

    // Pinch-to-zoom → onWheel while two fingers are on the surface
    if (event.touches.length >= 2 && pinching && engine.onWheel) {
      const dist = pinchDistance(event.touches);
      const delta = pinchPrevDist - dist; // shrink = positive (zoom out)
      pinchPrevDist = dist;
      if (Math.abs(delta) > 0.5) engine.onWheel(delta * 3);
      return;
    }

    if (engine.activeTouchId === null) return;
    const touch = Array.from(event.changedTouches).find(t => t.identifier === engine.activeTouchId);
    if (!touch) return;

    // Cancel long-press if finger moved too far
    if (longPressTimer !== null && longPressOrigin) {
      const dx = touch.clientX - longPressOrigin.x;
      const dy = touch.clientY - longPressOrigin.y;
      if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_TOLERANCE) clearLongPress();
    }

    if (engine.onMouseMove) engine.onMouseMove(position(touch));
  };

  engine.touchEnd = (event) => {
    clearLongPress();

    if (event.touches.length < 2) { pinchPrevDist = 0; pinching = false; }

    if (engine.activeTouchId === null) return;
    const touch = Array.from(event.changedTouches).find(t => t.identifier === engine.activeTouchId);
    if (!touch) return;
    if (event.cancelable) event.preventDefault();
    engine.activeTouchId = null;

    if (longPressFired) { longPressFired = false; return; }

    if (engine.onMouseUp) engine.onMouseUp(position(touch));
  };

  canvas.addEventListener('touchstart', engine.touchStart, { passive: false });
  canvas.addEventListener('touchmove', engine.touchMove, { passive: false });
  canvas.addEventListener('touchend', engine.touchEnd, { passive: false });
  canvas.addEventListener('touchcancel', engine.touchEnd, { passive: false });
}

export function detachTouchBridge(engine, canvas) {
  engine.activeTouchId = null;
  if (engine.onMouseUp) engine.onMouseUp();
  if (canvas) {
    canvas.removeEventListener('touchstart', engine.touchStart);
    canvas.removeEventListener('touchmove', engine.touchMove);
    canvas.removeEventListener('touchend', engine.touchEnd);
    canvas.removeEventListener('touchcancel', engine.touchEnd);
    canvas.style.touchAction = engine.previousTouchAction;
  }
}
