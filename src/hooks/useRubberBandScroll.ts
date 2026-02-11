import { useEffect, useRef, type RefObject } from 'react';

export function useRubberBandScroll(ref: RefObject<HTMLElement | null>) {
  const isOverscrolling = useRef(false);
  const startY = useRef(0);
  const currentTranslate = useRef(0);
  const rafId = useRef<number>(0);
  const maxOverscroll = 80;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const resistance = (distance: number) => {
      const sign = Math.sign(distance);
      return sign * Math.min(maxOverscroll, Math.pow(Math.abs(distance), 0.7));
    };

    const applyTransform = (px: number) => {
      currentTranslate.current = px;
      el.style.transform = `translateY(${px}px)`;
    };

    const snapBack = () => {
      el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      applyTransform(0);
      const onEnd = () => {
        el.style.transition = '';
        isOverscrolling.current = false;
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd);
    };

    const atTop = () => el.scrollTop <= 0;
    const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    // Touch handlers
    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY.current;
      if ((deltaY > 0 && atTop()) || (deltaY < 0 && atBottom())) {
        isOverscrolling.current = true;
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          applyTransform(resistance(deltaY));
        });
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (isOverscrolling.current) snapBack();
    };

    // Wheel handler
    let wheelTimeout: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      if ((e.deltaY < 0 && atTop()) || (e.deltaY > 0 && atBottom())) {
        isOverscrolling.current = true;
        const newVal = currentTranslate.current - e.deltaY * 0.3;
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          applyTransform(resistance(newVal));
        });
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (isOverscrolling.current) snapBack();
        }, 150);
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(rafId.current);
      clearTimeout(wheelTimeout);
    };
  }, [ref]);
}
