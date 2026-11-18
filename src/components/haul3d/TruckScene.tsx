import { Suspense, lazy, useEffect, useRef, useState } from 'react';

/* Thin island: the truck scene's models and textures load only once the section is near the viewport. */
const TruckWorld = lazy(() => import('./TruckWorld'));

export default function TruckScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0">
      {near && <Suspense fallback={null}><TruckWorld /></Suspense>}
    </div>
  );
}
