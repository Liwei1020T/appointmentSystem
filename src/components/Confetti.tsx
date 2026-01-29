/**
 * Confetti 庆祝动效组件
 *
 * 用于订单完成、成就解锁等场景的彩带撒花效果
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  shapes?: ('square' | 'circle')[];
  ticks?: number;
  gravity?: number;
  drift?: number;
  disableForReducedMotion?: boolean;
}

// 预设动效类型
type ConfettiPreset = 'celebration' | 'fireworks' | 'stars' | 'snow' | 'emoji';

// 预设配置
const presets: Record<ConfettiPreset, () => void> = {
  // 标准庆祝 - 彩带撒花
  celebration: () => {
    const count = 200;
    const defaults: ConfettiOptions = {
      origin: { x: 0.5, y: 0.5 },
      colors: ['#0F766E', '#84CC16', '#FFD54F', '#FF6B6B', '#4ECDC4'],
      disableForReducedMotion: true,
    };

    function fire(particleRatio: number, opts: ConfettiOptions) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      } as confetti.Options);
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  },

  // 烟花效果
  fireworks: () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults: ConfettiOptions = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      colors: ['#0F766E', '#84CC16', '#FFD54F', '#FF6B6B'],
      disableForReducedMotion: true,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      } as confetti.Options);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      } as confetti.Options);
    }, 250);
  },

  // 星星效果
  stars: () => {
    const defaults: ConfettiOptions = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFD54F', '#FFF59D', '#FFEE58'],
      shapes: ['circle'],
      disableForReducedMotion: true,
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        origin: { x: 0.5, y: 0.5 },
      } as confetti.Options);

      confetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.75,
        origin: { x: 0.5, y: 0.5 },
      } as confetti.Options);
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  },

  // 雪花效果
  snow: () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;

    const skew = 1;

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    (function frame() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return;

      const ticks = Math.max(200, 500 * (timeLeft / duration));
      confetti({
        particleCount: 1,
        startVelocity: 0,
        ticks,
        origin: {
          x: Math.random(),
          y: Math.random() * skew - 0.2,
        },
        colors: ['#ffffff'],
        shapes: ['circle'],
        gravity: randomInRange(0.4, 0.6),
        scalar: randomInRange(0.4, 1),
        drift: randomInRange(-0.4, 0.4),
        disableForReducedMotion: true,
      } as confetti.Options);

      requestAnimationFrame(frame);
    })();
  },

  // Emoji 效果
  emoji: () => {
    const scalar = 2;
    const emojis = ['🎉', '🎊', '✨', '🏸', '🎯'];

    const shapes = emojis.map((emoji) =>
      confetti.shapeFromText({ text: emoji, scalar })
    );

    const defaults: ConfettiOptions = {
      spread: 180,
      particleCount: 30,
      origin: { x: 0.5, y: 0.5 },
      scalar,
      disableForReducedMotion: true,
    };

    confetti({
      ...defaults,
      shapes,
    } as confetti.Options);
  },
};

// useConfetti Hook
export function useConfetti() {
  const fire = useCallback((preset: ConfettiPreset = 'celebration') => {
    presets[preset]();
  }, []);

  const fireCustom = useCallback((options: ConfettiOptions) => {
    confetti(options as confetti.Options);
  }, []);

  const reset = useCallback(() => {
    confetti.reset();
  }, []);

  return { fire, fireCustom, reset };
}

// Confetti 组件 - 自动触发
interface ConfettiComponentProps {
  trigger?: boolean;
  preset?: ConfettiPreset;
  autoTrigger?: boolean;
  delay?: number;
  onComplete?: () => void;
}

export function Confetti({
  trigger,
  preset = 'celebration',
  autoTrigger = false,
  delay = 0,
  onComplete,
}: ConfettiComponentProps) {
  const { fire } = useConfetti();
  const [hasFired, setHasFired] = useState(false);

  useEffect(() => {
    if (autoTrigger && !hasFired) {
      const timer = setTimeout(() => {
        fire(preset);
        setHasFired(true);
        onComplete?.();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, hasFired, fire, preset, delay, onComplete]);

  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => {
        fire(preset);
        onComplete?.();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, fire, preset, delay, onComplete]);

  return null;
}

// 订单完成专用庆祝
export function OrderCompleteConfetti({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (trigger) {
      // 组合效果：先是中心爆发，然后两侧烟花
      presets.celebration();
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.2, y: 0.6 },
          colors: ['#0F766E', '#84CC16'],
        } as confetti.Options);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x: 0.8, y: 0.6 },
          colors: ['#0F766E', '#84CC16'],
        } as confetti.Options);
      }, 300);
    }
  }, [trigger]);

  return null;
}

export default Confetti;
