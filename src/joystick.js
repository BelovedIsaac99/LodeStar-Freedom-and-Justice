/**
 * Center-screen 360° analog joystick with rotating direction indicator.
 */

export function createJoystick(zoneEl, onChange) {
  const base = zoneEl.querySelector('.joy-base');
  const compass = zoneEl.querySelector('.joy-compass');
  const arrow = zoneEl.querySelector('.joy-arrow');
  const knob = zoneEl.querySelector('.joy-knob');
  const degrees = zoneEl.querySelector('.joy-degrees');

  const maxRadius = 58;
  let active = false;
  let pointerId = null;
  let enabled = true;

  const state = { x: 0, y: 0, angle: 0, magnitude: 0, degrees: 0 };

  function centerPoint() {
    const rect = base.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function emit() {
    onChange({ ...state });
  }

  function setIdle() {
    state.x = 0;
    state.y = 0;
    state.angle = 0;
    state.magnitude = 0;
    state.degrees = 0;
    zoneEl.classList.remove('active');
    compass.style.transform = 'rotate(0deg)';
    arrow.style.transform = 'rotate(0deg)';
    knob.style.transform = 'translate(0px, 0px)';
    if (degrees) degrees.textContent = '—';
    emit();
  }

  function applyVector(dx, dy) {
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const mag = clamped / maxRadius;

    state.x = Math.cos(angle) * mag;
    state.y = Math.sin(angle) * mag;
    state.angle = angle;
    state.magnitude = mag;
    state.degrees = Math.round(((angle * 180) / Math.PI + 360) % 360);

    const knobX = Math.cos(angle) * clamped;
    const knobY = Math.sin(angle) * clamped;
    const rot = state.degrees;

    zoneEl.classList.add('active');
    compass.style.transform = `rotate(${rot}deg)`;
    arrow.style.transform = `rotate(${rot}deg)`;
    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    if (degrees) degrees.textContent = `${state.degrees}°`;
    emit();
  }

  function onPointerDown(e) {
    if (!enabled || e.button > 0) return;
    e.preventDefault();
    active = true;
    pointerId = e.pointerId;
    zoneEl.setPointerCapture(e.pointerId);
    const c = centerPoint();
    applyVector(e.clientX - c.x, e.clientY - c.y);
  }

  function onPointerMove(e) {
    if (!active || e.pointerId !== pointerId) return;
    e.preventDefault();
    const c = centerPoint();
    applyVector(e.clientX - c.x, e.clientY - c.y);
  }

  function onPointerUp(e) {
    if (!active || e.pointerId !== pointerId) return;
    e.preventDefault();
    active = false;
    pointerId = null;
    zoneEl.releasePointerCapture(e.pointerId);
    setIdle();
  }

  zoneEl.addEventListener('pointerdown', onPointerDown);
  zoneEl.addEventListener('pointermove', onPointerMove);
  zoneEl.addEventListener('pointerup', onPointerUp);
  zoneEl.addEventListener('pointercancel', onPointerUp);

  return {
    setEnabled(value) {
      enabled = value;
      if (!enabled) setIdle();
      zoneEl.classList.toggle('disabled', !enabled);
    },
    reset: setIdle,
    getState: () => ({ ...state }),
    destroy() {
      zoneEl.removeEventListener('pointerdown', onPointerDown);
      zoneEl.removeEventListener('pointermove', onPointerMove);
      zoneEl.removeEventListener('pointerup', onPointerUp);
      zoneEl.removeEventListener('pointercancel', onPointerUp);
      setIdle();
    },
  };
}
