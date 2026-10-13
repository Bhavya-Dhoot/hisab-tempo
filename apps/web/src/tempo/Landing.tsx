import { Suspense, lazy } from 'react';
import { SiteFooter, SiteHeader } from './Chrome';
import { Hero } from './sections/Hero';
import { ProofBand } from './sections/ProofBand';

const Rest = lazy(() => import('./LandingRest'));

// The pitch, in page order: the promise, the evidence, the pain, the product, your own numbers, the proof, the people, the plan.
// The first screen (hero and evidence band) is in the main bundle; the rest follows in its own chunk.
export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-bg font-sans text-text">
      <SiteHeader sections />
      <main>
        <Hero />
        <ProofBand />
        {/* The placeholder keeps the footer off the first screen while the rest loads, so nothing visible shifts. */}
        <Suspense fallback={<div className="min-h-[100dvh]" />}>
          <Rest />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
