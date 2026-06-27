export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function circlesOverlap(a, b) {
  return distance(a, b) <= a.radius + b.radius;
}

export function constrainCircleToDish(entity, dishRadius) {
  const limit = dishRadius - entity.radius;
  const d = Math.hypot(entity.x, entity.y);
  if (d <= limit || d === 0) {
    return false;
  }

  entity.x = (entity.x / d) * limit;
  entity.y = (entity.y / d) * limit;
  return true;
}

export function pointInCone(point, origin, facing, length, halfAngle) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const d = Math.hypot(dx, dy);
  if (d > length || d === 0) {
    return false;
  }

  const nx = dx / d;
  const ny = dy / d;
  const fx = Math.cos(facing);
  const fy = Math.sin(facing);
  const dot = nx * fx + ny * fy;
  return Math.acos(clamp(dot, -1, 1)) <= halfAngle;
}
