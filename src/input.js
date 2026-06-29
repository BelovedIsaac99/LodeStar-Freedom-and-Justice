/**
 * Cross-platform input abstraction — keyboard, mouse, and touch joystick
 * map to a single movement/fire/interact interface.
 */

export function getMoveVector(keys, joystick) {
  let mx = joystick.x;
  let my = joystick.y;

  if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) my += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }

  const angle = joystick.magnitude > 0.08
    ? joystick.angle
    : (len > 0 ? Math.atan2(my, mx) : 0);

  return {
    mx,
    my,
    angle,
    magnitude: len > 0 ? Math.min(1, len) : 0,
    fromJoystick: joystick.magnitude > 0.08,
  };
}

export function wantsFire(keys) {
  return !!keys['KeyF'];
}

export function wantsInteract(keys) {
  return !!keys['KeyE'];
}

export function wantsSquadOrder(keys) {
  return !!keys['Space'];
}

export function getMissionPhase(campaignPhases, missionId) {
  if (!campaignPhases?.length) return null;
  return campaignPhases.find((p) => p.missionIds?.includes(missionId)) ?? null;
}
