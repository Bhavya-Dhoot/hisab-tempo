import { useEffect } from 'react';
import { Calculator } from './sections/Calculator';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';
import { OnChain } from './sections/OnChain';
import { Pitch } from './sections/Pitch';
import { Problem } from './sections/Problem';
import { Roadmap } from './sections/Roadmap';
import { Roles } from './sections/Roles';
import { Tour } from './sections/Tour';

// Everything below the first screen. It loads after the hero has painted, so the top of the page shows sooner.
export default function LandingRest() {
  // A link such as /#calculator arrives before these sections exist; go to its target once they do.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);
  return (
    <>
      <Problem />
      <Tour />
      <Calculator />
      <OnChain />
      <Pitch />
      <Roles />
      <Roadmap />
      <Faq />
      <FinalCta />
    </>
  );
}
