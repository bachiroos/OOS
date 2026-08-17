// --- MANIFESTO CANVAS — PSYCHEDELIC EYE ---
  const mCanvas = document.getElementById('manifesto-canvas');
  const mCtx = mCanvas.getContext('2d');
  let mW, mH;

  let mStars = [], mSparkles = [];
  let mFrameCount = 0;
  let irisAngle = 0;
  let blinkT = 0, blinkState = 'open', nextBlinkFrame = 200;
  const isMobile = navigator.maxTouchPoints > 0;

  function resizeM() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mW = mCanvas.clientWidth; mH = mCanvas.clientHeight;
    mCanvas.width = Math.round(mW * dpr); mCanvas.height = Math.round(mH * dpr);
    mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    mStars = [];
    for (let i = 0; i < (isMobile ? 65 : 130); i++) {
      mStars.push({ x: Math.random() * mW, y: Math.random() * mH, radius: Math.random() * 1.4, speed: 0.08 + Math.random() * 0.3 });
    }

    const eyeRX = Math.min(mW, mH) * 0.36;
    mSparkles = [];
    for (let i = 0; i < (isMobile ? 8 : 18); i++) {
      const baseR = eyeRX * (0.75 + Math.random() * 0.7);
      mSparkles.push({
        angle: Math.random() * Math.PI * 2,
        radius: baseR,
        speed: (0.003 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
        hue: Math.random() * 360,
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7,
        alphaDrift: (Math.random() - 0.5) * 0.008
      });
    }
  }

  function drawStars(ctx) {
    mStars.forEach(s => {
      ctx.save(); ctx.globalAlpha = s.radius / 1.4 * 0.7; ctx.fillStyle = '#F0E8FF';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }

  function eyePath(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy);
    ctx.bezierCurveTo(cx - rx * 0.5, cy - ry * 1.15, cx + rx * 0.5, cy - ry * 1.15, cx + rx, cy);
    ctx.bezierCurveTo(cx + rx * 0.5, cy + ry * 1.15, cx - rx * 0.5, cy + ry * 1.15, cx - rx, cy);
    ctx.closePath();
  }

  function drawEyeAura(ctx, cx, cy, rx, ry) {
    const hue = (mFrameCount * 0.35) % 360;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, ry * 0.5, cx, cy, rx * 1.5);
    g.addColorStop(0,   `hsla(${hue}, 100%, 55%, 0.18)`);
    g.addColorStop(0.4, `hsla(${(hue + 60) % 360}, 100%, 50%, 0.08)`);
    g.addColorStop(1,   `hsla(${(hue + 120) % 360}, 100%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.scale(1, ry / rx);
    ctx.beginPath(); ctx.arc(cx, cy / (ry / rx), rx * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawIris(ctx, cx, cy, irisR) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.clip();

    // Base fill
    ctx.fillStyle = '#08001E';
    ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.fill();

    // Spokes (24 rotating lines)
    ctx.save(); ctx.globalAlpha = 0.55; ctx.lineWidth = 1.2;
    for (let sp = 0; sp < 24; sp++) {
      const angle = irisAngle + (sp / 24) * Math.PI * 2;
      const hue = (sp * 15 + mFrameCount * 0.5) % 360;
      ctx.strokeStyle = `hsl(${hue}, 100%, 58%)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * irisR, cy + Math.sin(angle) * irisR);
      ctx.stroke();
    }
    ctx.restore();

    // Concentric rings
    ctx.save(); ctx.lineWidth = 1;
    for (let r = 1; r <= 8; r++) {
      const radius = irisR * (r / 8);
      const hue = (r * 45 - mFrameCount * 0.25 + 120) % 360;
      ctx.globalAlpha = 0.4 + (r / 8) * 0.2;
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // Outer iris ring — bright, pulsing
    const outerHue = (mFrameCount * 0.6) % 360;
    ctx.save();
    ctx.shadowColor = `hsl(${outerHue}, 100%, 60%)`;
    ctx.shadowBlur = isMobile ? 0 : 14;
    ctx.strokeStyle = `hsl(${outerHue}, 100%, 65%)`;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(cx, cy, irisR - 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  function drawPupil(ctx, cx, cy, pupilR) {
    ctx.save();
    // Outer pupil glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pupilR * 1.5);
    g.addColorStop(0,   'rgba(0,0,0,1)');
    g.addColorStop(0.6, 'rgba(5,0,20,0.85)');
    g.addColorStop(1,   'rgba(5,0,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, pupilR * 1.5, 0, Math.PI * 2); ctx.fill();
    // Hard pupil
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#7B2FFF'; ctx.shadowBlur = isMobile ? 0 : 20;
    ctx.beginPath(); ctx.arc(cx, cy, pupilR, 0, Math.PI * 2); ctx.fill();
    // Tiny white specular dot
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(240,232,255,0.85)';
    ctx.beginPath(); ctx.arc(cx - pupilR * 0.28, cy - pupilR * 0.3, pupilR * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawEyelids(ctx, cx, cy, rx, ry, blinkT) {
    if (blinkT <= 0) return;
    ctx.save();
    ctx.fillStyle = '#080010';

    // Upper lid descends
    const coverY = cy - ry + blinkT * ry * 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 1.1, cy - ry * 1.5);
    ctx.lineTo(cx + rx * 1.1, cy - ry * 1.5);
    ctx.lineTo(cx + rx * 1.1, coverY);
    ctx.bezierCurveTo(cx + rx * 0.5, coverY - ry * 0.25, cx - rx * 0.5, coverY - ry * 0.25, cx - rx * 1.1, coverY);
    ctx.closePath(); ctx.fill();

    // Lower lid rises
    const coverYL = cy + ry - blinkT * ry * 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 1.1, cy + ry * 1.5);
    ctx.lineTo(cx + rx * 1.1, cy + ry * 1.5);
    ctx.lineTo(cx + rx * 1.1, coverYL);
    ctx.bezierCurveTo(cx + rx * 0.5, coverYL + ry * 0.25, cx - rx * 0.5, coverYL + ry * 0.25, cx - rx * 1.1, coverYL);
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  function drawSparkles(ctx) {
    const cx = mW / 2, cy = mH / 2;
    mSparkles.forEach(sp => {
      const x = cx + Math.cos(sp.angle) * sp.radius;
      const y = cy + Math.sin(sp.angle) * sp.radius;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, sp.alpha));
      ctx.shadowColor = `hsl(${sp.hue}, 100%, 60%)`;
      ctx.shadowBlur = isMobile ? 0 : 8;
      ctx.fillStyle = `hsl(${sp.hue}, 100%, 65%)`;
      ctx.beginPath(); ctx.arc(x, y, sp.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
  }

  function drawEye(ctx) {
    const cx = mW / 2, cy = mH / 2;
    const rx = Math.min(mW, mH) * 0.36;
    const ry = Math.min(mW, mH) * 0.13;
    const irisR = ry * 0.88;
    const pupilR = irisR * (0.32 + Math.sin(mFrameCount * 0.018) * 0.18);

    // Eye shape clip
    ctx.save();
    eyePath(ctx, cx, cy, rx, ry);
    ctx.clip();

    // Sclera
    const sclG = ctx.createRadialGradient(cx, cy, irisR, cx, cy, rx);
    sclG.addColorStop(0, '#0A0028');
    sclG.addColorStop(1, '#04001A');
    ctx.fillStyle = sclG;
    ctx.fillRect(cx - rx, cy - ry * 1.2, rx * 2, ry * 2.4);

    // Iris
    drawIris(ctx, cx, cy, irisR);

    // Pupil
    drawPupil(ctx, cx, cy, pupilR);

    ctx.restore(); // end eye clip

    // Eye outline (lash line)
    ctx.save();
    const outlineHue = (mFrameCount * 0.5) % 360;
    ctx.strokeStyle = `hsl(${outlineHue}, 100%, 55%)`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `hsl(${outlineHue}, 100%, 55%)`;
    ctx.shadowBlur = isMobile ? 0 : 12;
    eyePath(ctx, cx, cy, rx, ry);
    ctx.stroke();
    ctx.restore();

    // Eyelids (drawn over everything — simulates blink)
    drawEyelids(ctx, cx, cy, rx, ry, blinkT);
  }

  function updateManifestoGame() {
    // Stars
    mStars.forEach(s => { s.x -= s.speed; if (s.x < 0) { s.x = mW; s.y = Math.random() * mH; } });

    // Iris rotation
    irisAngle += 0.004;

    // Sparkles orbit + alpha drift
    mSparkles.forEach(sp => {
      sp.angle += sp.speed;
      sp.alpha += sp.alphaDrift;
      sp.hue = (sp.hue + 0.4) % 360;
      if (sp.alpha > 1 || sp.alpha < 0.1) sp.alphaDrift *= -1;
    });

    // Blink state machine
    const BLINK_CLOSE_FRAMES = 18, BLINK_HOLD_FRAMES = 8, BLINK_OPEN_FRAMES = 22;
    if (blinkState === 'open') {
      if (mFrameCount >= nextBlinkFrame) { blinkState = 'closing'; }
    } else if (blinkState === 'closing') {
      blinkT = Math.min(1, blinkT + 1 / BLINK_CLOSE_FRAMES);
      if (blinkT >= 1) { blinkT = 1; blinkState = 'holding'; nextBlinkFrame = mFrameCount + BLINK_HOLD_FRAMES; }
    } else if (blinkState === 'holding') {
      if (mFrameCount >= nextBlinkFrame) blinkState = 'opening';
    } else if (blinkState === 'opening') {
      blinkT = Math.max(0, blinkT - 1 / BLINK_OPEN_FRAMES);
      if (blinkT <= 0) { blinkT = 0; blinkState = 'open'; nextBlinkFrame = mFrameCount + 180 + Math.floor(Math.random() * 220); }
    }

    mFrameCount++;
  }

  function manifestoLoop() {
    mCtx.fillStyle = '#080010';
    mCtx.fillRect(0, 0, mW, mH);
    drawStars(mCtx);
    const cx = mW / 2, cy = mH / 2;
    const rx = Math.min(mW, mH) * 0.36;
    const ry = Math.min(mW, mH) * 0.13;
    drawEyeAura(mCtx, cx, cy, rx, ry);
    drawEye(mCtx);
    drawSparkles(mCtx);
    updateManifestoGame();
    requestAnimationFrame(manifestoLoop);
  }

  let _rTimer, _lastRW = 0;
  window.addEventListener('resize', () => {
    clearTimeout(_rTimer);
    _rTimer = setTimeout(() => {
      const w = mCanvas.clientWidth;
      if (w !== _lastRW) { _lastRW = w; resizeM(); }
    }, 200);
  });
  resizeM();
  manifestoLoop();

