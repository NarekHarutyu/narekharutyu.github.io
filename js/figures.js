/*
 * Generative figures drawn on <canvas>.
 *
 *   canvas[data-figure="lorenz"]   The hero. The Lorenz system integrated live with RK4 and
 *                                  drawn as a fading light trail, like the long-exposure
 *                                  drone flight in the gallery.
 *
 * The figure pauses while off-screen or while the tab is hidden, and draws a single
 * still frame for visitors who prefer reduced motion.
 */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  const readPalette = () => {
    const style = getComputedStyle(document.documentElement);
    const token = (name) => style.getPropertyValue(name).trim();
    return {
      accent: token('--accent'),
      blend: token('--figure-blend') || 'source-over',
    };
  };

  const rgba = (hex, alpha) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  };

  const onThemeChange = (fn) => {
    document.addEventListener('themechange', fn);
    darkScheme.addEventListener('change', fn);
  };

  // Keeps a canvas backing store matched to its CSS box and the device pixel ratio.
  const trackSize = (canvas, onResize) => {
    const size = { w: 1, h: 1, dpr: 1 };
    const measure = () => {
      const box = canvas.getBoundingClientRect();
      size.dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.w = Math.max(1, box.width);
      size.h = Math.max(1, box.height);
      canvas.width = Math.round(size.w * size.dpr);
      canvas.height = Math.round(size.h * size.dpr);
      onResize();
    };
    new ResizeObserver(measure).observe(canvas);
    return size;
  };

  // Calls frame(dt) every animation frame while `el` is on screen and the tab is visible.
  const runWhileVisible = (el, frame) => {
    let raf = 0;
    let last = 0;
    let onScreen = false;
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
      last = now;
      frame(dt);
      raf = requestAnimationFrame(tick);
    };
    const update = () => {
      const run = onScreen && !document.hidden && !reducedMotion.matches;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    }).observe(el);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
  };

  /* Lorenz attractor -------------------------------------------------------- */

  function lorenz(canvas) {
    const ctx = canvas.getContext('2d');
    const readout = canvas.closest('figure')?.querySelector('[data-telemetry]');
    const hero = canvas.closest('.hero') || canvas;

    const SIGMA = 10;
    const RHO = 28;
    const BETA = 8 / 3;
    const DT = 0.005;
    const RATE = 150; // integration steps per second of wall time
    const N = 5600; // points kept in the trail (about 28 time units)
    const BUCKETS = 32; // trail is stroked in this many alpha bands

    const trail = new Float32Array(N * 3);
    const p = new Float64Array([0.1, 0, 20]);
    const k1 = new Float64Array(3);
    const k2 = new Float64Array(3);
    const k3 = new Float64Array(3);
    const k4 = new Float64Array(3);
    let head = 0;
    let count = 0;
    let t = 0;

    const f = (x, y, z, out) => {
      out[0] = SIGMA * (y - x);
      out[1] = x * (RHO - z) - y;
      out[2] = x * y - BETA * z;
    };

    const step = () => {
      const [x, y, z] = p;
      const h = DT;
      f(x, y, z, k1);
      f(x + (k1[0] * h) / 2, y + (k1[1] * h) / 2, z + (k1[2] * h) / 2, k2);
      f(x + (k2[0] * h) / 2, y + (k2[1] * h) / 2, z + (k2[2] * h) / 2, k3);
      f(x + k3[0] * h, y + k3[1] * h, z + k3[2] * h, k4);
      for (let i = 0; i < 3; i++) p[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      t += h;
      trail[head * 3] = p[0];
      trail[head * 3 + 1] = p[1];
      trail[head * 3 + 2] = p[2];
      head = (head + 1) % N;
      if (count < N) count++;
    };

    for (let i = 0; i < 500; i++) step(); // settle onto the attractor
    head = 0;
    count = 0;
    for (let i = 0; i < N; i++) step(); // pre-fill so both wings are visible on load
    const t0 = t;

    // View: a slow sway about the vertical axis, nudged by the pointer.
    let clock = 0;
    let yaw = -0.25;
    const pitch = 0.16;
    let aimYaw = 0;
    let aimPitch = 0;
    let offYaw = 0;
    let offPitch = 0;

    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      aimYaw = (event.clientX / window.innerWidth - 0.5) * 0.5;
      aimPitch = (event.clientY / window.innerHeight - 0.5) * 0.3;
    });
    hero.addEventListener('pointerleave', () => {
      aimYaw = 0;
      aimPitch = 0;
    });

    let colors = readPalette();

    const draw = () => {
      const { w, h, dpr } = size;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);

      const scale = Math.min((h * 0.8) / 48, (w * 0.86) / 56);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const a = yaw + offYaw;
      const b = pitch + offPitch;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      const start = (head - count + N) % N;
      let px = cx;
      let py = cy;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = colors.accent;
      ctx.globalCompositeOperation = colors.blend;

      for (let k = 0; k < BUCKETS; k++) {
        const i0 = Math.floor((k * count) / BUCKETS);
        const i1 = Math.min(count - 1, Math.floor(((k + 1) * count) / BUCKETS));
        const q = (k + 1) / BUCKETS;
        ctx.globalAlpha = 0.035 + 0.965 * Math.pow(q, 2.6);
        ctx.lineWidth = 0.7 + 1.1 * q * q;
        ctx.beginPath();
        for (let i = i0; i <= i1; i++) {
          const j = ((start + i) % N) * 3;
          const x = trail[j];
          const y = trail[j + 1];
          const z = trail[j + 2] - 25;
          const across = x * ca - y * sa;
          const depth = x * sa + y * ca;
          px = cx + across * scale;
          py = cy - (z * cb - depth * sb) * scale;
          if (i === i0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // The head of the trail: a small lamp, like the drone's LED in the photo.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 18);
      glow.addColorStop(0, rgba(colors.accent, 0.4));
      glow.addColorStop(1, rgba(colors.accent, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    };

    const signed = (v) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2).padStart(5, '0')}`;
    const writeReadout = () => {
      if (!readout) return;
      readout.textContent =
        `t ${(t - t0).toFixed(2).padStart(6, ' ')}   ` +
        `x ${signed(p[0])}   y ${signed(p[1])}   z ${signed(p[2])}`;
    };

    const size = trackSize(canvas, draw);
    onThemeChange(() => {
      colors = readPalette();
      draw();
    });

    let carry = 0;
    let sinceReadout = 1;
    runWhileVisible(canvas, (dt) => {
      clock += dt;
      carry += dt * RATE;
      while (carry >= 1) {
        step();
        carry -= 1;
      }
      // sway gently; much past ±0.6 rad the wings fold edge-on into a thin "V"
      yaw = 0.3 * Math.sin(clock * 0.07) - 0.12;
      const ease = Math.min(1, dt * 3);
      offYaw += (aimYaw - offYaw) * ease;
      offPitch += (aimPitch - offPitch) * ease;
      draw();
      sinceReadout += dt;
      if (sinceReadout > 0.1) {
        writeReadout();
        sinceReadout = 0;
      }
    });
    writeReadout();
  }

  document.querySelectorAll('canvas[data-figure="lorenz"]').forEach(lorenz);
})();
