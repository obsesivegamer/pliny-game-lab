// Shared touch-to-mouse adapter for engines that interact via onMouseDown/Move/Up.
// Bridges touch events onto the engine's existing mouse handlers with single-finger
// tracking, cancellation support, and destroy-time cleanup.
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
  engine.touchStart = (event) => {
    if (event.cancelable) event.preventDefault();
    if (engine.activeTouchId !== null) return;
    const touch = event.changedTouches[0];
    engine.activeTouchId = touch.identifier;
    if (engine.onMouseDown) engine.onMouseDown(position(touch));
  };
  engine.touchMove = (event) => {
    if (engine.activeTouchId === null) return;
    if (event.cancelable) event.preventDefault();
    const touch = Array.from(event.changedTouches).find(t => t.identifier === engine.activeTouchId);
    if (touch && engine.onMouseMove) engine.onMouseMove(position(touch));
  };
  engine.touchEnd = (event) => {
    if (engine.activeTouchId === null) return;
    const touch = Array.from(event.changedTouches).find(t => t.identifier === engine.activeTouchId);
    if (!touch) return;
    if (event.cancelable) event.preventDefault();
    engine.activeTouchId = null;
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
