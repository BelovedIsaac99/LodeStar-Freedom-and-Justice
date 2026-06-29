/** Lightweight SFX via litecanvas ZzFX (falls back silently if unavailable) */

function play(params) {
  if (typeof zzfx !== 'function') return;
  try { zzfx(...params); } catch { /* no audio context */ }
}

export function sfxShoot() {
  play([,,,,.08,.02,,,1,.1,,,,,,,,,,.01,,,,,.5]);
}

export function sfxHit() {
  play([,,,,.06,.03,,,,.5,,,,,,,,,,.02,,,,,.3]);
}

export function sfxIntel() {
  play([1.2,,,,.04,.02,1,1.5,,,,,,,,,,,,.01,,,,,.6]);
}

export function sfxOrder() {
  play([,,,,.05,.01,,,1.2,.08,,,,,,,,,,.02,,,,,.4]);
}

export function sfxComplete() {
  play([1.5,,,,.08,.04,1,2,,,,,,,,,,,,.01,,,,,.7]);
}

export function sfxFail() {
  play([.5,,,,.12,.08,,,.8,-0.2,,,,,,,,,,.03,,,,,.5]);
}

export function sfxInteract() {
  play([,,,,.03,.01,,,1.5,.05,,,,,,,,,,.015,,,,,.35]);
}

export function sfxTribute() {
  play([.8,,,,.2,.15,,,.6,,,,,,,,,,,.04,,,,,.8]);
}
