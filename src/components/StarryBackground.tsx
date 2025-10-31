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
}

interface ShootingStar {
  x: number;
  y: number;
  startX: number;
  startY: number;
  size: number;
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
      initStars();
    };

    // Initialize stars with varied properties
    const initStars = () => {
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.7), // Upper 70% of screen
        size: Math.random() * 1.5 + 0.8, // 0.8px to 2.3px
        opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8 (more visible)
        blur: Math.random() * 0.8, // 0 to 0.8px blur (reduced from 1.5)
        driftSpeed: Math.random() * 0.04 + 0.02, // More noticeable drift
        driftOffset: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 1.0 + 0.5, // Faster pulse speeds (1.5x speed)
        pulseOffset: Math.random() * Math.PI * 2, // Random pulse start
      }));
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
      
      shootingStarsRef.current.push({
        x: startX,
        y: startY,
        startX,
        startY,
        size: Math.random() * 2 + 4, // 4-6px initially (consistent size, no pulse)
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
        const baseSize = (Math.random() * 2 + 4); // Keep consistent base size
        star.size = (1 - progress * 0.7) * baseSize; // Shrink to 30% of original size
        
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
    let lastShootingStarTime = Date.now() + 3000; // Add 3 second delay on initial load
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

      // Create shooting stars randomly (every 20-40 seconds - much less frequent)
      const currentTime = Date.now();
      if (currentTime - lastShootingStarTime > Math.random() * 20000 + 20000) {
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

      starsRef.current.forEach((star) => {
        // Calculate vertical fade (stars fade toward bottom)
        const verticalFade = 1 - (star.y / canvas.height) * 0.7; // 70% fade at bottom
        
        // More pronounced pulsing effect for glow
        const pulse = Math.sin(time * star.pulseSpeed + star.pulseOffset) * 0.3 + 0.7; // 0.4 to 1.0 (more range)
        const finalOpacity = star.opacity * verticalFade * pulse;

        // More noticeable horizontal drift
        const driftX = Math.sin(time * star.driftSpeed + star.driftOffset) * 2; // Increased from 0.5 to 2

        // Draw star with blur effect
        ctx.save();
        
        // Apply soft blur
        ctx.filter = `blur(${star.blur}px)`;
        
        // Create soft glow gradient
        const gradient = ctx.createRadialGradient(
          star.x + driftX,
          star.y,
          0,
          star.x + driftX,
          star.y,
          star.size * 2 * pulse // Pulsing glow radius
        );
        
        // Desaturated white/blue
        gradient.addColorStop(0, `rgba(245, 248, 255, ${finalOpacity})`);
        gradient.addColorStop(0.5, `rgba(230, 240, 255, ${finalOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(230, 240, 255, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x + driftX, star.y, star.size * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

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