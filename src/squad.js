/** Squad AI — Follow, Defend, Attack + escort helpers */

export const SQUAD_STATE = { FOLLOW: 'FOLLOW', DEFEND: 'DEFEND', ATTACK: 'ATTACK' };

export const SQUAD_ORDER = [SQUAD_STATE.FOLLOW, SQUAD_STATE.DEFEND, SQUAD_STATE.ATTACK];

export const SQUAD_ROSTER = [
  {
    id: 'adjetey',
    name: 'Adjetey',
    role: 'leader',
    radius: 14,
    speed: 4.5,
    shootRate: 0.35,
    isPlayer: true,
  },
  {
    id: 'attipoe',
    name: 'Attipoe',
    role: 'recon',
    radius: 13,
    speed: 5.2,
    shootRate: 0.45,
    followOffset: { angle: Math.PI + 0.6, dist: 45 },
  },
  {
    id: 'lamptey',
    name: 'Lamptey',
    role: 'infiltrator',
    radius: 13,
    speed: 4.8,
    shootRate: 0.5,
    followOffset: { angle: Math.PI + 1.2, dist: 60 },
  },
];

const FOLLOW_CUSHION = 40;

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findNearestEnemy(from, enemies, range) {
  let best = null;
  let bestDist = range;
  for (const e of enemies) {
    if (e.dead) continue;
    const ex = e.x ?? e.body?.position.x;
    const ey = e.y ?? e.body?.position.y;
    const d = Math.hypot(from.x - ex, from.y - ey);
    if (d < bestDist) {
      bestDist = d;
      best = { x: ex, y: ey, entity: e };
    }
  }
  return best;
}

export function cycleSquadState(current) {
  const idx = SQUAD_ORDER.indexOf(current);
  return SQUAD_ORDER[(idx + 1) % SQUAD_ORDER.length];
}

export function getFollowTarget(leader, index, followerCfg) {
  const offset = followerCfg?.followOffset
    ?? SQUAD_ROSTER[index + 1]?.followOffset
    ?? { angle: Math.PI, dist: FOLLOW_CUSHION };
  return {
    x: leader.x + Math.cos(offset.angle) * offset.dist,
    y: leader.y + Math.sin(offset.angle) * offset.dist,
  };
}

export function moveBodyToward(body, target, speed, Matter) {
  const dx = target.x - body.position.x;
  const dy = target.y - body.position.y;
  const d = Math.hypot(dx, dy);
  if (d < 8) {
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    return Math.atan2(dy, dx);
  }
  Matter.Body.setVelocity(body, { x: (dx / d) * speed, y: (dy / d) * speed });
  return Math.atan2(dy, dx);
}

export function updateFollower(follower, leader, index, squadState, enemies, dt, Matter) {
  const body = follower.body;
  const pos = { x: body.position.x, y: body.position.y };
  follower.shootCooldown = Math.max(0, follower.shootCooldown - dt);

  if (squadState === SQUAD_STATE.DEFEND) {
    if (!follower.defendPos) follower.defendPos = { x: pos.x, y: pos.y };
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setPosition(body, follower.defendPos);
    const target = findNearestEnemy(pos, enemies, 220);
    if (target && follower.shootCooldown <= 0) {
      follower.shootCooldown = follower.shootRate;
      const angle = Math.atan2(target.y - pos.y, target.x - pos.x);
      follower.angle = angle;
      return { angle, shoot: true };
    }
    return { angle: follower.angle ?? 0, shoot: false };
  }

  if (squadState === SQUAD_STATE.ATTACK) {
    follower.defendPos = null;
    const target = findNearestEnemy(pos, enemies, 9999);
    if (target) {
      const angle = moveBodyToward(body, target, follower.speed * 30, Matter);
      if (dist(pos, target) < 200 && follower.shootCooldown <= 0) {
        follower.shootCooldown = follower.shootRate;
        follower.angle = angle;
        return { angle, shoot: true };
      }
      follower.angle = angle;
      return { angle, shoot: false };
    }
  }

  follower.defendPos = null;
  const followTarget = getFollowTarget(
    { x: leader.body.position.x, y: leader.body.position.y },
    index,
    follower
  );
  const angle = moveBodyToward(body, followTarget, follower.speed * 25, Matter);
  const shootTarget = findNearestEnemy(pos, enemies, 160);
  if (shootTarget && follower.shootCooldown <= 0) {
    follower.shootCooldown = follower.shootRate;
    const a = Math.atan2(shootTarget.y - pos.y, shootTarget.x - pos.x);
    follower.angle = a;
    return { angle: a, shoot: true };
  }
  follower.angle = angle;
  return { angle, shoot: false };
}

/** Escort NPCs slowly trail the player */
export function updateEscort(escort, playerPos, dt) {
  if (escort.dead) return;
  const speed = escort.cart ? 35 : escort.vip ? 45 : 55;
  const tx = playerPos.x - 30 + (escort.offsetX ?? 0);
  const ty = playerPos.y + (escort.offsetY ?? 0);
  const d = dist(escort, { x: tx, y: ty });
  if (d > 6) {
    const move = Math.min(speed * dt, d);
    escort.x += ((tx - escort.x) / d) * move;
    escort.y += ((ty - escort.y) / d) * move;
  }
}

/** Asare NPC pathing for mission 7 */
export function updateAsareNpc(npc, dt) {
  if (!npc.path || npc.pathIndex >= npc.path.length) return;
  const target = npc.path[npc.pathIndex];
  const d = dist(npc, target);
  const speed = 50;
  if (d < 10) {
    npc.pathIndex++;
    return;
  }
  const move = Math.min(speed * dt, d);
  npc.x += ((target.x - npc.x) / d) * move;
  npc.y += ((target.y - npc.y) / d) * move;
}
