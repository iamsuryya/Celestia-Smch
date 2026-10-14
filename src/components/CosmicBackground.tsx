import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface Comet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  alpha: number;
  color: string;
}

interface MouseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette for stars
    const starColors = ['#FFF7D6', '#D4AF37', '#93C5FD', '#E0E7FF', '#C084FC', '#FFFFFF'];

    // Generate Stars
    const starCount = Math.min(Math.floor((width * height) / 4500), 180);
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      baseAlpha: Math.random() * 0.6 + 0.25,
      twinkleSpeed: Math.random() * 0.03 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      color: starColors[Math.floor(Math.random() * starColors.length)]
    }));

    // Generate Comets / Shooting Stars
    const comets: Comet[] = [];
    let cometTimer = 0;

    const spawnComet = () => {
      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.4);
      const angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1); // ~45 deg down right
      const speed = Math.random() * 6 + 4;
      comets.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 80 + 60,
        speed,
        alpha: 1,
        color: Math.random() > 0.4 ? '#FFF6DF' : '#93C5FD'
      });
    };

    // Mouse particles for interactive stardust trail
    const mouseParticles: MouseParticle[] = [];
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.3) return; // limit density
      const particleColors = ['#D4AF37', '#FFF7D6', '#93C5FD', '#F5E7C4'];
      mouseParticles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2 - 0.5,
        size: Math.random() * 2.2 + 0.8,
        alpha: 1,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
      });
      if (mouseParticles.length > 40) mouseParticles.shift();
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Planets Configuration for Solar System background orbit
    const sunCenterX = () => width * 0.5;
    const sunCenterY = () => height * 0.22;

    let orbitAngleBase = 0;

    const planets = [
      { name: 'Mercury', rx: 140, ry: 45, speed: 0.02, size: 3.5, color: '#E2E8F0' },
      { name: 'Venus', rx: 220, ry: 70, speed: 0.014, size: 5, color: '#FCE7F3' },
      { name: 'Earth', rx: 320, ry: 100, speed: 0.009, size: 6, color: '#60A5FA', hasMoon: true },
      { name: 'Mars', rx: 420, ry: 135, speed: 0.007, size: 4.5, color: '#F87171' },
      { name: 'Jupiter', rx: 550, ry: 175, speed: 0.004, size: 9, color: '#EAB308', hasRings: true },
      { name: 'Saturn', rx: 690, ry: 220, speed: 0.0028, size: 8, color: '#FCD34D', hasRings: true }
    ];

    // Animation Loop
    let lastTime = performance.now();

    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      orbitAngleBase += delta * 0.15;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebula Background Gradients
      const nebula1 = ctx.createRadialGradient(width * 0.5, height * 0.2, 10, width * 0.5, height * 0.2, width * 0.6);
      nebula1.addColorStop(0, 'rgba(79, 30, 130, 0.25)');
      nebula1.addColorStop(0.5, 'rgba(29, 78, 216, 0.12)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.8, height * 0.6, 20, width * 0.8, height * 0.6, width * 0.5);
      nebula2.addColorStop(0, 'rgba(212, 175, 55, 0.08)');
      nebula2.addColorStop(0.6, 'rgba(109, 40, 217, 0.12)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Solar System Sun Core (Central Celestial Body)
      const cx = sunCenterX();
      const cy = sunCenterY();

      // Outer Sun Glow
      const sunGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 80);
      sunGlow.addColorStop(0, 'rgba(255, 247, 214, 0.9)');
      sunGlow.addColorStop(0.2, 'rgba(212, 175, 55, 0.5)');
      sunGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Inner Sun Sphere
      ctx.fillStyle = '#FFF6DF';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Orbit Lines & Planets
      planets.forEach((p, idx) => {
        // Scaling orbit radii for smaller screens
        const scale = width < 640 ? 0.55 : width < 1024 ? 0.75 : 1;
        const rx = p.rx * scale;
        const ry = p.ry * scale;

        // Draw Elliptical Orbit Ring
        ctx.strokeStyle = idx % 2 === 0 ? 'rgba(212, 175, 55, 0.12)' : 'rgba(147, 197, 253, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate Planet Position
        const angle = orbitAngleBase * (p.speed * 10) + idx * 1.2;
        const px = cx + Math.cos(angle) * rx;
        const py = cy + Math.sin(angle) * ry;

        // Draw Planet Glow
        const pGlow = ctx.createRadialGradient(px, py, 1, px, py, p.size * 2.5);
        pGlow.addColorStop(0, p.color);
        pGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Planet Body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Rings for Saturn / Jupiter
        if (p.hasRings) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(px, py, p.size * 2, p.size * 0.6, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Moon for Earth
        if (p.hasMoon) {
          const moonAngle = orbitAngleBase * 3;
          const mx = px + Math.cos(moonAngle) * 12;
          const my = py + Math.sin(moonAngle) * 6;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. Draw Stars with Twinkle Animation
      stars.forEach((s) => {
        s.twinklePhase += s.twinkleSpeed;
        const currentAlpha = Math.max(0.1, Math.min(1, s.baseAlpha + Math.sin(s.twinklePhase) * 0.35));

        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra flare on bright stars
        if (s.size > 1.4 && currentAlpha > 0.6) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - s.size * 2.5, s.y);
          ctx.lineTo(s.x + s.size * 2.5, s.y);
          ctx.moveTo(s.x, s.y - s.size * 2.5);
          ctx.lineTo(s.x, s.y + s.size * 2.5);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // 5. Update and Draw Comets / Shooting Stars
      cometTimer += delta;
      if (cometTimer > 3.5) {
        spawnComet();
        cometTimer = 0;
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.x += c.dx;
        c.y += c.dy;
        c.alpha -= 0.008;

        if (c.alpha <= 0 || c.x > width || c.y > height) {
          comets.splice(i, 1);
          continue;
        }

        const tailX = c.x - (c.dx / c.speed) * c.length;
        const tailY = c.y - (c.dy / c.speed) * c.length;

        const cometGrad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        cometGrad.addColorStop(0, c.color);
        cometGrad.addColorStop(0.3, 'rgba(212, 175, 55, 0.6)');
        cometGrad.addColorStop(1, 'transparent');

        ctx.strokeStyle = cometGrad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Comet head spark
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Draw Interactive Mouse Trail Stardust
      for (let i = mouseParticles.length - 1; i >= 0; i--) {
        const mp = mouseParticles[i];
        mp.x += mp.vx;
        mp.y += mp.vy;
        mp.alpha -= 0.02;

        if (mp.alpha <= 0) {
          mouseParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = mp.color;
        ctx.globalAlpha = mp.alpha;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, mp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050714]">
      {/* HTML5 Canvas for real-time stars, comets, orbits & planets */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Foreground Ambient Glow Grid */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.06) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />
    </div>
  );
};
