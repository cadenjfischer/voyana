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

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | undefined>();

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

    // Animate stars with subtle drift
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

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