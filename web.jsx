import React, { useState, useEffect, useRef } from 'react';

const AsciiRippleWebsite = () => {
  const canvasRef = useRef(null);
  const [ripples, setRipples] = useState([]);
  const [shapeRipples, setShapeRipples] = useState([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  const ASCII_CHARS = ['@', '#', '$', '%', '&', '*', '+', '=', '-', ':', '.', ' '];
  const SHAPES = ['star', 'moon', 'heart', 'cloud'];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(255,182,193);stop-opacity:0.3" />
            <stop offset="50%" style="stop-color:rgb(221,160,221);stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:rgb(176,224,230);stop-opacity:0.3" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        ${generateStars(canvas.width, canvas.height)}
      </svg>
    `);

    img.onload = () => {
      const animate = () => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        // Update and draw cursor ripples
        setRipples(prev => {
          const updated = prev
            .map(r => ({ ...r, radius: r.radius + 3, opacity: r.opacity - 0.02 }))
            .filter(r => r.opacity > 0);
          return updated;
        });

        // Update and draw shape ripples
        setShapeRipples(prev => {
          const updated = prev
            .map(r => ({ ...r, radius: r.radius + 2, opacity: r.opacity - 0.015 }))
            .filter(r => r.opacity > 0);
          return updated;
        });

        // Draw all ripples with ASCII
        [...ripples, ...shapeRipples].forEach(ripple => {
          drawAsciiRipple(ctx, ripple);
        });

        // Apply white overlay with ripple cutouts
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cut out ripple areas
        ctx.globalCompositeOperation = 'destination-out';
        [...ripples, ...shapeRipples].forEach(ripple => {
          if (ripple.shape) {
            drawShapeMask(ctx, ripple);
          } else {
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.globalCompositeOperation = 'source-over';
        animationFrame.current = requestAnimationFrame(animate);
      };

      animate();
    };

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, {
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        opacity: 1
      }]);
    };

    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const randomX = Math.random() * canvas.width;
        const randomY = Math.random() * canvas.height;
        
        setShapeRipples(prev => [...prev, {
          x: randomX,
          y: randomY,
          radius: 0,
          opacity: 1,
          shape: randomShape
        }]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [ripples, shapeRipples]);

  const generateStars = (width, height) => {
    let stars = '';
    const starTypes = [
      { size: 3, color: '#FFB6C1', count: 15 },
      { size: 4, color: '#DDA0DD', count: 12 },
      { size: 5, color: '#B0E0E6', count: 10 },
      { size: 2, color: '#FFE4B5', count: 20 }
    ];

    starTypes.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const rotation = Math.random() * 360;
        stars += `
          <g transform="translate(${x},${y}) rotate(${rotation})">
            <polygon points="0,-${type.size} ${type.size * 0.3},-${type.size * 0.3} ${type.size * 0.9},-${type.size * 0.3} ${type.size * 0.4},${type.size * 0.1} ${type.size * 0.6},${type.size * 0.8} 0,${type.size * 0.4} -${type.size * 0.6},${type.size * 0.8} -${type.size * 0.4},${type.size * 0.1} -${type.size * 0.9},-${type.size * 0.3} -${type.size * 0.3},-${type.size * 0.3}" 
                    fill="${type.color}" opacity="0.6"/>
          </g>
        `;
      }
    });

    return stars;
  };

  const drawAsciiRipple = (ctx, ripple) => {
    const charCount = Math.floor(ripple.radius / 8);
    ctx.font = '12px monospace';
    ctx.globalAlpha = ripple.opacity * 0.7;

    for (let i = 0; i < charCount; i++) {
      const angle = (i / charCount) * Math.PI * 2;
      const x = ripple.x + Math.cos(angle) * ripple.radius;
      const y = ripple.y + Math.sin(angle) * ripple.radius;
      const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      
      const hue = (ripple.x + ripple.y) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
      ctx.fillText(char, x, y);
    }

    ctx.globalAlpha = 1;
  };

  const drawShapeMask = (ctx, ripple) => {
    const scale = ripple.radius / 50;
    ctx.save();
    ctx.translate(ripple.x, ripple.y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    switch (ripple.shape) {
      case 'star':
        drawStar(ctx, 0, 0, 5, 30, 15);
        break;
      case 'moon':
        drawMoon(ctx, 0, 0, 25);
        break;
      case 'heart':
        drawHeart(ctx, 0, 0, 25);
        break;
      case 'cloud':
        drawCloud(ctx, 0, 0, 40);
        break;
    }
    ctx.fill();
    ctx.restore();
  };

  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  const drawMoon = (ctx, cx, cy, radius) => {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.5, cy, radius * 0.8, 0, Math.PI * 2, true);
  };

  const drawHeart = (ctx, cx, cy, size) => {
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx, cy - size / 2, cx - size, cy - size / 2, cx - size, cy);
    ctx.bezierCurveTo(cx - size, cy + size / 2, cx, cy + size, cx, cy + size * 1.5);
    ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size / 2, cx + size, cy);
    ctx.bezierCurveTo(cx + size, cy - size / 2, cx, cy - size / 2, cx, cy);
  };

  const drawCloud = (ctx, cx, cy, size) => {
    ctx.arc(cx - size * 0.3, cy, size * 0.4, 0, Math.PI * 2);
    ctx.arc(cx, cy - size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.3, cy, size * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.5, cy + size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.arc(cx - size * 0.5, cy + size * 0.1, size * 0.3, 0, Math.PI * 2);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-white cursor-none">
      <canvas
        ref={canvasRef}
        className="block"
      />
      <div className="fixed top-4 left-4 text-xs text-gray-400 font-mono opacity-30">
        Move cursor to reveal • Press SPACE for shapes
      </div>
    </div>
  );
};

export default AsciiRippleWebsite;