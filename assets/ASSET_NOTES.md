# Petri Jack Asset Pack Notes

This is the cleaned 2D asset pack for Petri Jack.

## Jack Sprite Notes

- All Jack sheets use 96x96 frames.
- Idle sheets use 4 frames each.
- Run sheets use 8 frames each.
- Recommended Jack anchor is bottom-center style: [0.5, 0.88].
- Recommended initial drawScale is 1.0.
- Frames were cleaned to remove detached orange/brown artifacts beneath the feet.
- Frames were re-aligned for more consistent foot placement and centering.
- Jack sheets contain only the character on transparency; no baked glow, no floor ring, no loose fragments, and no effect sprites.

## Effects

- `flame_cone.png` is a separate flamethrower effect sprite.
- `bleach_puddle.png` is a separate pale chemical cloud/bleach effect and is intentionally not green.
- Effects are not baked into Jack animation frames.
- The in-game flame anchor is tuned so the longer flame starts ahead of Jack instead of overlapping his body.

## Integration Advice

- Use `asset-manifest.json` as the source of frame size, frame count, fps, anchor, drawScale, and drawOffset.
- Keep gameplay collision separate from sprite bounds.
- If additional tuning is needed, adjust draw offsets/scales in code or the manifest rather than editing the PNGs first.
