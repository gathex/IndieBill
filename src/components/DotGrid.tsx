"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface DotGridProps {
  baseColor?: string;
  activeColor?: string;
  shape?: "circle" | "square";
  dotSize?: number;
  gap?: number;
  proximity?: number;
  strength?: number;
  bounce?: number;
  tension?: number;
  returnDuration?: number;
  shockRadius?: number;
  shockStrength?: number;
  swell?: number;
  stretch?: number;
  glow?: number;
  fade?: number;
  intro?: boolean;
  opacity?: number;
  mouseInteraction?: boolean;
  clickShock?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Dot {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  colorRatio: number;
  introDelay: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  speed: number;
  age: number;
  duration: number;
}

function parseColor(color: string): [number, number, number, number] {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("") + "ff";
    } else if (hex.length === 4) {
      hex = hex.split("").map((c) => c + c).join("");
    } else if (hex.length === 6) {
      hex += "ff";
    }
    const num = parseInt(hex, 16);
    return [
      (num >> 24) & 255,
      (num >> 16) & 255,
      (num >> 8) & 255,
      (num & 255) / 255,
    ];
  }
  const rgbMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (rgbMatch) {
    return [
      parseFloat(rgbMatch[1]),
      parseFloat(rgbMatch[2]),
      parseFloat(rgbMatch[3]),
      rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    ];
  }
  return [18, 18, 18, 1];
}

export function DotGrid({
  baseColor = "#121212",
  activeColor = "#ffffff",
  shape = "circle",
  dotSize = 3,
  gap = 10,
  proximity = 170,
  strength = 1,
  bounce = 0.6,
  tension = 0.55,
  returnDuration = 0.8,
  shockRadius = 320,
  shockStrength = 5,
  swell = 1.2,
  stretch = 0.5,
  glow = 0.6,
  fade = 0,
  intro = true,
  opacity = 1,
  mouseInteraction = true,
  clickShock = true,
  className = "",
  style,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Initialize dots grid based on dimensions
  const initDots = useCallback(
    (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;

      const spacing = dotSize + gap;
      const cols = Math.floor(w / spacing);
      const rows = Math.floor(h / spacing);

      const offsetX = (w - cols * spacing + spacing) / 2;
      const offsetY = (h - rows * spacing + spacing) / 2;

      const centerX = w / 2;
      const centerY = h / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY) || 1;

      const newDots: Dot[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originX = offsetX + c * spacing;
          const originY = offsetY + r * spacing;

          const dx = originX - centerX;
          const dy = originY - centerY;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);
          const introDelay = (distFromCenter / maxDist) * 0.5;

          newDots.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            scale: intro ? 0 : 1,
            colorRatio: 0,
            introDelay,
          });
        }
      }
      dotsRef.current = newDots;
      startTimeRef.current = performance.now();
    },
    [dotSize, gap, intro]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const [baseR, baseG, baseB, baseA] = parseColor(baseColor);
    const [actR, actG, actB, actA] = parseColor(activeColor);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleResize = (newWidth: number, newHeight: number) => {
      if (newWidth <= 0 || newHeight <= 0) return;

      const prev = sizeRef.current;
      if (Math.abs(prev.width - newWidth) < 1 && Math.abs(prev.height - newHeight) < 1) {
        return;
      }

      sizeRef.current = { width: newWidth, height: newHeight };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetWidth = Math.floor(newWidth * dpr);
      const targetHeight = Math.floor(newHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      initDots(newWidth, newHeight);
    };

    // Initial measurement from parent or canvas
    const parent = canvas.parentElement;
    const initialRect = parent
      ? parent.getBoundingClientRect()
      : canvas.getBoundingClientRect();
    handleResize(initialRect.width, initialRect.height);

    // ResizeObserver watches parent without modifying parent size
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        if (entryWidth > 0 && entryHeight > 0) {
          handleResize(entryWidth, entryHeight);
        }
      }
    });

    if (parent) {
      resizeObserver.observe(parent);
    }

    // Pointer events on parent container / window
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { width: w, height: h } = sizeRef.current;
      if (x >= -50 && x <= w + 50 && y >= -50 && y <= h + 50) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        mouseRef.current.active = true;
      } else {
        mouseRef.current.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickShock) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const { width: w, height: h } = sizeRef.current;
      if (x >= 0 && x <= w && y >= 0 && y <= h) {
        shockwavesRef.current.push({
          x,
          y,
          radius: 0,
          maxRadius: shockRadius,
          strength: shockStrength,
          speed: 680,
          age: 0,
          duration: returnDuration || 0.8,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    let lastTime = performance.now();

    // Main animation loop
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const elapsed = (now - startTimeRef.current) / 1000;

      const { width: w, height: h } = sizeRef.current;
      if (w <= 0 || h <= 0) {
        if (!prefersReducedMotion) {
          animFrameRef.current = requestAnimationFrame(render);
        }
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Update shockwaves
      const activeShockwaves: Shockwave[] = [];
      for (const shock of shockwavesRef.current) {
        shock.age += dt;
        shock.radius += shock.speed * dt;
        if (shock.age < shock.duration && shock.radius < shock.maxRadius) {
          activeShockwaves.push(shock);
        }
      }
      shockwavesRef.current = activeShockwaves;

      // Spring physics parameters
      const springK = 0.04 * tension + 0.015;
      const damping = Math.min(
        0.96,
        Math.max(0.65, 1 - ((1 - bounce) * 0.12) / Math.max(0.1, returnDuration))
      );

      const mouse = mouseRef.current;
      const dots = dotsRef.current;
      const proxSq = proximity * proximity;
      const halfDot = dotSize / 2;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Intro scaling
        if (intro) {
          if (elapsed > dot.introDelay) {
            const introProgress = Math.min(1, (elapsed - dot.introDelay) / 0.5);
            const ease = 1 + Math.sin((introProgress - 1) * Math.PI * 1.5) * Math.pow(1 - introProgress, 2);
            dot.scale = Math.min(1.2, Math.max(0, ease));
          } else {
            dot.scale = 0;
            continue;
          }
        }

        // Mouse proximity interaction
        let targetColorRatio = 0;
        let targetSwell = 1;

        if (mouse.active && mouseInteraction && !prefersReducedMotion) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < proxSq) {
            const dist = Math.sqrt(dSq) || 0.001;
            const factor = 1 - dist / proximity;
            const push = factor * factor * strength * 24;

            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * push;
            dot.vy += Math.sin(angle) * push;

            targetColorRatio = Math.pow(factor, 1.2);
            targetSwell = 1 + (swell - 1) * Math.pow(factor, 1.4);
          }
        }

        // Shockwave ripples
        if (!prefersReducedMotion && activeShockwaves.length > 0) {
          for (let s = 0; s < activeShockwaves.length; s++) {
            const shock = activeShockwaves[s];
            const dx = dot.x - shock.x;
            const dy = dot.y - shock.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
            const waveDist = Math.abs(dist - shock.radius);
            const waveWidth = 55;

            if (waveDist < waveWidth) {
              const waveFactor = (1 - waveDist / waveWidth) * (1 - shock.age / shock.duration);
              const push = waveFactor * shock.strength * 18;
              const angle = Math.atan2(dy, dx);
              dot.vx += Math.cos(angle) * push;
              dot.vy += Math.sin(angle) * push;

              targetColorRatio = Math.max(targetColorRatio, waveFactor * 0.95);
              targetSwell = Math.max(targetSwell, 1 + (swell - 1) * waveFactor * 1.3);
            }
          }
        }

        // Spring restoration towards origin
        if (!prefersReducedMotion) {
          const fx = (dot.originX - dot.x) * springK;
          const fy = (dot.originY - dot.y) * springK;

          dot.vx = (dot.vx + fx) * damping;
          dot.vy = (dot.vy + fy) * damping;

          dot.x += dot.vx;
          dot.y += dot.vy;
        } else {
          dot.x = dot.originX;
          dot.y = dot.originY;
        }

        // Smooth transition for color and scale
        dot.colorRatio += (targetColorRatio - dot.colorRatio) * 0.18;
        if (!intro || elapsed > dot.introDelay + 0.5) {
          dot.scale += (targetSwell - dot.scale) * 0.2;
        }

        // Render dot
        const cRatio = Math.max(0, Math.min(1, dot.colorRatio));
        const r = Math.round(baseR + (actR - baseR) * cRatio);
        const g = Math.round(baseG + (actG - baseG) * cRatio);
        const b = Math.round(baseB + (actB - baseB) * cRatio);

        const fadeMultiplier = 1 - fade * (1 - cRatio);
        const alpha = Math.max(
          0,
          Math.min(1, (baseA + (actA - baseA) * cRatio) * opacity * fadeMultiplier)
        );

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        const currentRadius = halfDot * Math.max(0.1, dot.scale);
        const vel = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);

        // Glow when active
        if (glow > 0 && cRatio > 0.08) {
          ctx.shadowColor = `rgba(${actR},${actG},${actB},${cRatio * glow * 0.8})`;
          ctx.shadowBlur = glow * 8 * cRatio;
        } else {
          ctx.shadowBlur = 0;
        }

        // Stretch along motion vector
        if (stretch > 0 && vel > 0.4 && !prefersReducedMotion) {
          const stretchFactor = 1 + Math.min(2.2, vel * stretch * 0.18);
          const angle = Math.atan2(dot.vy, dot.vx);

          ctx.save();
          ctx.translate(dot.x, dot.y);
          ctx.rotate(angle);

          ctx.beginPath();
          if (shape === "circle") {
            ctx.ellipse(0, 0, currentRadius * stretchFactor, currentRadius / Math.sqrt(stretchFactor), 0, 0, Math.PI * 2);
          } else {
            ctx.rect(
              -currentRadius * stretchFactor,
              -currentRadius,
              currentRadius * 2 * stretchFactor,
              currentRadius * 2
            );
          }
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          if (shape === "circle") {
            ctx.arc(dot.x, dot.y, currentRadius, 0, Math.PI * 2);
          } else {
            ctx.rect(dot.x - currentRadius, dot.y - currentRadius, currentRadius * 2, currentRadius * 2);
          }
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
    };
  }, [
    baseColor,
    activeColor,
    shape,
    dotSize,
    gap,
    proximity,
    strength,
    bounce,
    tension,
    returnDuration,
    shockRadius,
    shockStrength,
    swell,
    stretch,
    glow,
    fade,
    intro,
    opacity,
    mouseInteraction,
    clickShock,
    initDots,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none block w-full h-full ${className}`}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default DotGrid;
