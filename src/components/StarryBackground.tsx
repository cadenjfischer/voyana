'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  blur: number;
  driftSpeed: number;
  driftOffset: number;
  pulseSpeed: number;
  pulseOffset: number;
  // Twinkle state
  isTwinkle?: boolean;
  twinkleTarget?: { x: number; y: number };
  twinkleProgress?: number; // 0 to 1
  twinklePulsePhase?: number;
  twinkleStartTime?: number;
  lastPulse?: number;
  twinklePulseDuration?: number;
  twinklePhaseOffset?: number;
}

interface ShootingStar {
  x: number;
  y: number;
  startX: number;
  startY: number;
  size: number;
  initialSize: number; // Store initial size for consistent shrinking
  opacity: number;
  speed: number;
  angle: number;
  curveIntensity: number;
  distance: number;
  maxDistance: number;
  active: boolean;
}

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const twinkleStarsRef = useRef<number[]>([]); // Store indices of twinkle stars
  const staticStarsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticStarsCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const lastSpawnPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Setup offscreen canvas for static stars
      if (!staticStarsCanvasRef.current) {
        staticStarsCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = staticStarsCanvasRef.current;
      offscreen.width = window.innerWidth;
      offscreen.height = window.innerHeight;
      staticStarsCtxRef.current = offscreen.getContext('2d');
      initStars();
      // Pick 10 random twinkle stars
      const count = starsRef.current.length;
      const indices = Array.from({ length: count }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const twinkleIndices = indices.slice(0, 10);
      twinkleStarsRef.current = twinkleIndices;
      // Mark twinkle stars and set initial targets
      twinkleIndices.forEach(idx => {
        const star = starsRef.current[idx];
        if (star) {
          star.isTwinkle = true;
          star.twinkleTarget = randomTwinkleTarget(canvas.width, canvas.height);
          star.twinkleProgress = 1; // Start at target
          star.twinklePulsePhase = Math.random() * Math.PI * 2;
          star.twinkleStartTime = 0;
          star.lastPulse = -1;
          star.twinklePulseDuration = 1.5 + Math.random() * 2.5; // 1.5 to 4 seconds
          star.twinklePhaseOffset = Math.random();
        }
      });

      function randomTwinkleTarget(width: number, height: number) {
        return {
          x: Math.random() * width,
          y: Math.random() * height * (0.7 + 0.3 * Math.random()), // favor upper 70% but allow full height
        };
      }
      drawStaticStars();
    };

    // Initialize stars with varied properties
    const initStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < 140; i++) {
        let y = Math.random() * canvas.height;
        const verticalPosition = y / canvas.height;
        const keepProbability = 1 - Math.pow(verticalPosition, 2);
        if (Math.random() > keepProbability) {
          y = Math.random() * canvas.height * 0.6;
        }
        stars.push({
          x: Math.random() * canvas.width,
          y,
          size: Math.random() * 1.5 + 0.8,
          opacity: Math.random() * 0.5 + 0.3,
          blur: Math.random() * 0.8,
          driftSpeed: Math.random() * 0.04 + 0.02,
          driftOffset: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 1.0 + 0.5,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    };

    // Draw static stars to offscreen canvas
    const drawStaticStars = () => {
      const offscreen = staticStarsCanvasRef.current;
      const offctx = staticStarsCtxRef.current;
      if (!offscreen || !offctx) return;
      offctx.clearRect(0, 0, offscreen.width, offscreen.height);
      starsRef.current.forEach((star) => {
        // Calculate vertical fade (stars fade toward bottom)
        const verticalFade = 1 - (star.y / offscreen.height) * 0.7;
        // More pronounced pulsing effect for glow (use pulse=1 for static layer)
        const pulse = 1;
        const finalOpacity = star.opacity * verticalFade * pulse;
        const driftX = 0; // No drift for static layer
        offctx.save();
        offctx.filter = `blur(${star.blur}px)`;
        const gradient = offctx.createRadialGradient(
          star.x + driftX,
          star.y,
          0,
          star.x + driftX,
          star.y,
          star.size * 2 * pulse
        );
        gradient.addColorStop(0, `rgba(245, 248, 255, ${finalOpacity})`);
        gradient.addColorStop(0.5, `rgba(230, 240, 255, ${finalOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(230, 240, 255, 0)`);
        offctx.fillStyle = gradient;
        offctx.beginPath();
        offctx.arc(star.x + driftX, star.y, star.size * 2 * pulse, 0, Math.PI * 2);
        offctx.fill();
        offctx.restore();
      });
    };

    // Create a new shooting star
    const createShootingStar = () => {
      if (!canvas) return;
      
      let startX: number = 0;
      let startY: number = 0;
      let angle: number = 0;
      let attempts = 0;
      const maxAttempts = 10;
      const minDistance = 300; // Minimum distance from last spawn (not too close)
      
      // Keep trying to find a good spawn position
      while (attempts < maxAttempts) {
        // Randomly choose spawn location along top, left, and right edges
        const edgeChoice = Math.random();
        
        if (edgeChoice < 0.6) {
          // 60% chance: Spawn anywhere along the entire top edge (left to right)
          startX = Math.random() * canvas.width;
          startY = 0;
          
          // Angle depends on position on top edge
          if (startX < canvas.width * 0.3) {
            // Left third: shoot down-right
            angle = Math.random() * 25 + 45; // 45-70 degrees
          } else if (startX < canvas.width * 0.7) {
            // Middle third: shoot more downward
            angle = Math.random() * 30 + 60; // 60-90 degrees
          } else {
            // Right third: shoot down-left
            angle = Math.random() * 25 + 100; // 100-125 degrees
          }
        } else if (edgeChoice < 0.8) {
          // 20% chance: Spawn on left edge
          startX = 0;
          startY = Math.random() * canvas.height * 0.5; // Upper half of left edge
          angle = Math.random() * 30 + 30; // 30-60 degrees (down and right)
        } else {
          // 20% chance: Spawn on right edge
          startX = canvas.width;
          startY = Math.random() * canvas.height * 0.5; // Upper half of right edge
          angle = Math.random() * 30 + 150; // 150-180 degrees (down and left)
        }
        
        // Check distance from last spawn position
        if (lastSpawnPositionRef.current) {
          const dx = startX - lastSpawnPositionRef.current.x;
          const dy = startY - lastSpawnPositionRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If distance is good (at least 300px away), use this position
          if (distance >= minDistance) {
            break;
          }
        } else {
          // First spawn, any position is fine
          break;
        }
        
        attempts++;
      }
      
      // Update last spawn position
      lastSpawnPositionRef.current = { x: startX, y: startY };
      
      const initialSize = Math.random() * 2 + 4; // 4-6px initially
      shootingStarsRef.current.push({
        x: startX,
        y: startY,
        startX,
        startY,
        size: initialSize,
        initialSize, // Store for consistent shrinking
        opacity: 1,
        speed: Math.random() * 2 + 5, // 5-7 pixels per frame
        angle,
        curveIntensity: Math.random() * 0.015 + 0.01, // Subtle curve
        distance: 0,
        maxDistance: Math.random() * 300 + 700, // Travel 700-1000px
        active: true,
      });
    };

    // Update shooting stars
    const updateShootingStars = () => {
      shootingStarsRef.current = shootingStarsRef.current.filter(star => {
        if (!star.active) return false;

        // Move the star along a curved path
        star.distance += star.speed;
        const progress = star.distance / star.maxDistance;
        
        // Calculate position with curve (parabolic motion)
        const angleRad = (star.angle * Math.PI) / 180;
        star.x = star.startX + Math.cos(angleRad) * star.distance + Math.sin(progress * Math.PI) * star.curveIntensity * 100;
        star.y = star.startY + Math.sin(angleRad) * star.distance;
        
        // Fade out and shrink as it gets further (perspective effect)
        star.opacity = 1 - progress;
        // Use stored initial size for consistent shrinking (no pulsing)
        star.size = (1 - progress * 0.7) * star.initialSize; // Shrink to 30% of original size
        
        // Deactivate if too far or faded
        if (progress >= 1 || star.opacity <= 0) {
          star.active = false;
        }
        
        return star.active;
      });
    };

    // Draw shooting star with glow trail
    const drawShootingStar = (ctx: CanvasRenderingContext2D, star: ShootingStar) => {
      ctx.save();
      
      // Calculate trail positions
      const angleRad = (star.angle * Math.PI) / 180;
      const trailLength = star.size * 8;
      const tailX = star.x - Math.cos(angleRad) * trailLength;
      const tailY = star.y - Math.sin(angleRad) * trailLength;
      
      // Draw glowing trail
      const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity * 0.9})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.opacity * 0.6})`);
      gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = star.size;
      ctx.lineCap = 'round';
      ctx.filter = `blur(${star.size * 0.5}px)`;
      
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      
      // Draw bright core
      ctx.filter = `blur(${star.size * 0.3}px)`;
      const coreGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
      coreGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      coreGradient.addColorStop(0.5, `rgba(220, 235, 255, ${star.opacity * 0.7})`);
      coreGradient.addColorStop(1, `rgba(220, 235, 255, 0)`);
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    // Animate stars with subtle drift
    let time = 0;
  let shootingStarFirstDelay = 1500 + Math.random() * 3500; // 1.5s to 5s
  let lastShootingStarTime = Date.now() + shootingStarFirstDelay;
  let firstShootingStarDone = false;
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw cached static stars layer
      const offscreen = staticStarsCanvasRef.current;
      if (offscreen) {
        ctx.drawImage(offscreen, 0, 0);
      }

      // Animate twinkle stars (draw over cached layer)
      const twinkleIndices = twinkleStarsRef.current;
      twinkleIndices.forEach(idx => {
        const star = starsRef.current[idx];
        if (!star) return;
        // Each star has its own pulse duration and phase offset
        const duration = star.twinklePulseDuration || 2.5;
        if (!star.twinkleStartTime || isNaN(star.twinkleStartTime)) {
          star.twinkleStartTime = time;
        }
        // Add phase offset so they don't all start together
        const phaseOffset = star.twinklePhaseOffset || 0;
        let pulseProgress = (((time - star.twinkleStartTime) / duration + phaseOffset) % 1);
        // Pulse: ease in/out, less harsh
        const twinkle = 0.5 + 0.5 * Math.sin(pulseProgress * Math.PI * 2 - Math.PI / 2); // 0 to 1
        const twinkleOpacity = star.opacity * (0.3 + 0.7 * twinkle); // 0.3 to 1.0
        const twinkleSize = star.size * (0.85 + 0.3 * twinkle);

        // On each new pulse, jump to a new position
        const pulseNum = Math.floor(((time - star.twinkleStartTime) / duration + phaseOffset));
        if (star.lastPulse === undefined || pulseNum !== star.lastPulse) {
          star.x = Math.random() * canvas.width;
          star.y = Math.random() * canvas.height * (0.7 + 0.3 * Math.random());
          star.lastPulse = pulseNum;
        }

        ctx.save();
        ctx.filter = `blur(${star.blur}px)`;
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          twinkleSize * 2
        );
        gradient.addColorStop(0, `rgba(245, 248, 255, ${twinkleOpacity})`);
        gradient.addColorStop(0.5, `rgba(230, 240, 255, ${twinkleOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(230, 240, 255, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, twinkleSize * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      time += 0.01;

      // Create shooting stars: first one 1.5-5s after load, then 25-45s intervals
      const currentTime = Date.now();
      if (!firstShootingStarDone && currentTime >= lastShootingStarTime) {
        createShootingStar();
        lastShootingStarTime = currentTime;
        firstShootingStarDone = true;
      } else if (firstShootingStarDone && currentTime - lastShootingStarTime > Math.random() * 20000 + 25000) {
        createShootingStar();
        lastShootingStarTime = currentTime;
      }

      // Update and draw shooting stars
      updateShootingStars();
      shootingStarsRef.current.forEach(star => {
        if (star.active) {
          drawShootingStar(ctx, star);
        }
      });

      // Draw subtle gradient overlay to mimic skyline fade (lighter at top)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)'); // Subtle white at top
      skyGradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.03)'); // Fade to less
      skyGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)'); // Almost nothing
      skyGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Completely transparent at bottom
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}