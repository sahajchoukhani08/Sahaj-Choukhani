import React, { useEffect, useRef } from 'react';
import { VisualizerMode, ColorPalette } from '../types';

interface CanvasVisualizerProps {
  mode: VisualizerMode;
  palette: ColorPalette;
  speed: number;
  isBreathingGuideActive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  pulsePhase: number;
}

export const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({
  mode,
  palette,
  speed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; isInside: boolean }>({
    x: 0,
    y: 0,
    isInside: false,
  });

  // Particle state reference
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    const handleResize = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-initialize particles when resized
      initParticles();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    const initParticles = () => {
      const count = Math.floor((width * height) / 12000) + 45;
      const particles: Particle[] = [];
      const colors = palette.colors.slice(1); // skip darkest

      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)] || '#38bdf8';
        const baseAlpha = 0.2 + Math.random() * 0.55;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: 1.5 + Math.random() * 3.5,
          color,
          alpha: baseAlpha,
          baseAlpha,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
      particlesRef.current = particles;
    };

    handleResize();

    // Render loop
    const render = () => {
      time += 0.012 * speed;
      ctx.clearRect(0, 0, width, height);

      // 1. Base ambient gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, palette.colors[0]);
      bgGrad.addColorStop(1, '#02040a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (mode === 'particles') {
        drawParticles(ctx, width, height, time, palette);
      } else if (mode === 'gradient') {
        drawGradientFlow(ctx, width, height, time, palette);
      } else if (mode === 'aurora') {
        drawAuroraBreathing(ctx, width, height, time, palette);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const drawParticles = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number,
      t: number,
      pal: ColorPalette
    ) => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Draw subtle background radial glow
      const centerGlow = context.createRadialGradient(
        w / 2,
        h / 2,
        20,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      centerGlow.addColorStop(0, `${pal.colors[2]}18`);
      centerGlow.addColorStop(1, 'transparent');
      context.fillStyle = centerGlow;
      context.fillRect(0, 0, w, h);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Wrap around bounds
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Subtle pulsing
        p.alpha = p.baseAlpha + Math.sin(t * 2 + p.pulsePhase) * 0.15;

        // Mouse gentle repulsion
        if (mouse.isInside) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140;
            p.x += (dx / dist) * force * 1.5;
            p.y += (dy / dist) * force * 1.5;
          }
        }

        // Connect nearby particles with constellation lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 95;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.22;
            context.beginPath();
            context.strokeStyle = `${pal.colors[2]}${Math.floor(lineAlpha * 255).toString(16).padStart(2, '0')}`;
            context.lineWidth = 0.8;
            context.moveTo(p.x, p.y);
            context.lineTo(p2.x, p2.y);
            context.stroke();
          }
        }

        // Draw particle with soft glow halo
        context.save();
        context.globalAlpha = Math.max(0.05, Math.min(0.9, p.alpha));
        
        // Outer halo
        const haloGrad = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        haloGrad.addColorStop(0, p.color);
        haloGrad.addColorStop(1, 'transparent');
        context.fillStyle = haloGrad;
        context.beginPath();
        context.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        context.fill();

        // Core
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        context.fill();

        context.restore();
      }
    };

    const drawGradientFlow = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number,
      t: number,
      pal: ColorPalette
    ) => {
      // Create multi-layer swirling gradient blobs
      const numBlobs = 4;
      const colors = pal.colors;

      for (let i = 0; i < numBlobs; i++) {
        const offset = i * (Math.PI / 2);
        const radius = Math.min(w, h) * (0.35 + 0.15 * Math.sin(t * 0.8 + offset));
        
        const cx = w * 0.5 + Math.sin(t * 0.6 + offset) * (w * 0.28);
        const cy = h * 0.5 + Math.cos(t * 0.5 + offset * 1.3) * (h * 0.28);

        const color = colors[(i + 1) % colors.length];

        const grad = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `${color}99`);
        grad.addColorStop(0.5, `${color}33`);
        grad.addColorStop(1, 'transparent');

        context.save();
        context.globalCompositeOperation = 'screen';
        context.fillStyle = grad;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // Floating gentle luminous dust
      const dustCount = 18;
      for (let i = 0; i < dustCount; i++) {
        const dx = (Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
        const dy = (Math.cos(t * 0.2 + i * 2.1) * 0.5 + 0.5) * h;
        const dSize = 1.5 + Math.sin(t + i) * 1;
        
        context.save();
        context.globalAlpha = 0.4 + 0.3 * Math.sin(t * 1.5 + i);
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(dx, dy, Math.max(1, dSize), 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    };

    const drawAuroraBreathing = (
      context: CanvasRenderingContext2D,
      w: number,
      h: number,
      t: number,
      pal: ColorPalette
    ) => {
      // 16-second complete 4-4-4-4 box breathing cycle
      // 0-4s Inhale, 4-8s Hold, 8-12s Exhale, 12-16s Hold
      const breathPeriod = 16 / speed;
      const breathTime = (t * (1 / 0.012) * 0.016) % breathPeriod;
      const normalizedCycle = (breathTime / breathPeriod) * (Math.PI * 2);
      
      // Smooth breathing expansion scale (0.85 to 1.18)
      const breathScale = 1.0 + Math.sin(normalizedCycle - Math.PI / 2) * 0.18;

      // Draw undulating aurora ribbon waves
      const numRibbons = 5;
      const colors = pal.colors;

      for (let r = 0; r < numRibbons; r++) {
        const color = colors[(r + 1) % colors.length];
        const ribbonOffset = (r * Math.PI) / 3;
        const baseY = h * 0.4 + (r - numRibbons / 2) * 45;

        context.save();
        context.globalCompositeOperation = 'screen';
        context.beginPath();

        const step = 20;
        let isFirst = true;

        for (let x = 0; x <= w + step; x += step) {
          const wave1 = Math.sin(x * 0.003 + t * 0.8 + ribbonOffset) * 55 * breathScale;
          const wave2 = Math.cos(x * 0.006 - t * 0.5 + r) * 35;
          const y = baseY + wave1 + wave2;

          if (isFirst) {
            context.moveTo(x, y);
            isFirst = false;
          } else {
            context.lineTo(x, y);
          }
        }

        context.lineTo(w, h);
        context.lineTo(0, h);
        context.closePath();

        const grad = context.createLinearGradient(0, baseY - 60, 0, h);
        grad.addColorStop(0, `${color}40`);
        grad.addColorStop(0.4, `${color}20`);
        grad.addColorStop(1, 'transparent');

        context.fillStyle = grad;
        context.fill();
        context.restore();
      }

      // Central breathing mandala ring guide
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.16;
      const currentRadius = baseRadius * breathScale;

      context.save();
      context.globalCompositeOperation = 'screen';

      // Outer aura
      const auraGrad = context.createRadialGradient(cx, cy, currentRadius * 0.5, cx, cy, currentRadius * 1.8);
      auraGrad.addColorStop(0, `${pal.colors[2]}33`);
      auraGrad.addColorStop(0.7, `${pal.colors[3]}15`);
      auraGrad.addColorStop(1, 'transparent');
      context.fillStyle = auraGrad;
      context.beginPath();
      context.arc(cx, cy, currentRadius * 1.8, 0, Math.PI * 2);
      context.fill();

      // Glowing pulsing rings
      context.lineWidth = 2.0;
      context.strokeStyle = `${pal.colors[2]}88`;
      context.beginPath();
      context.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      context.stroke();

      context.lineWidth = 1.0;
      context.strokeStyle = `${pal.colors[3]}55`;
      context.beginPath();
      context.arc(cx, cy, currentRadius * 0.75, 0, Math.PI * 2);
      context.stroke();

      context.restore();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [mode, palette, speed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isInside: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.isInside = false;
  };

  return (
    <div
      ref={containerRef}
      id="focus-visualizer-container"
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        id="focus-visualizer-canvas"
        className="block w-full h-full"
      />
    </div>
  );
};
