import { useMemo } from 'react';
import styles from './ParticleBackground.module.css';

interface Particle {
  id: number;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
  duration: string;
  delay: string;
  size: number;
}

export default function ParticleBackground() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 300 }, (_, i) => {
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 150;
      const endX = startX + Math.cos(angle) * distance;
      const endY = startY + Math.sin(angle) * distance;
      const duration = 8 + Math.random() * 12;
      const delay = Math.random() * 5;
      const size = 1 + Math.random() * 4;

      return {
        id: i,
        startX: `${startX}vw`,
        startY: `${startY}vh`,
        endX: `${endX}vw`,
        endY: `${endY}vh`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        size,
      };
    });
  }, []);

  return (
    <div className={styles.coverParticles}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.particle}
          style={{
            '--start-x': particle.startX,
            '--start-y': particle.startY,
            '--end-x': particle.endX,
            '--end-y': particle.endY,
            '--duration': particle.duration,
            '--delay': particle.delay,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
