import { useState } from 'react';
import { H2, Reveal, Section } from '../kit';

const VIDEOS = [
  { id: 'pitch', title: 'The pitch', length: '2:00', about: 'The founders, in two voices: the problem, why Tempo, how it works, and what is live.' },
  { id: 'demo', title: 'The demo', length: '2:50', about: 'One invoice, start to finish: register, finance, the refused second financier, the memo payment, the waterfall.' },
];

// One wide player. The two films are chosen from a row above it, so the picture gets the full width.
export function Pitch() {
  const [id, setId] = useState(VIDEOS[0].id);
  const v = VIDEOS.find((x) => x.id === id)!;
  return (
    <Section id="pitch">
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h2 className={H2}>The pitch, in two minutes.</h2>
        <div className="flex gap-2" role="group" aria-label="Choose a video">
          {VIDEOS.map((x) => (
            <button
              key={x.id}
              onClick={() => setId(x.id)}
              aria-pressed={x.id === id}
              className={`h-11 whitespace-nowrap rounded-ui border px-4 text-[15px] font-semibold transition-colors duration-150 ease-ledger active:translate-y-px ${
                x.id === id ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-muted hover:text-text'
              }`}
            >
              {x.title} <span className="font-mono font-normal tabular">{x.length}</span>
            </button>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.08} className="mt-10">
        <figure>
          {/* key remounts the player so the poster and source switch together */}
          <video
            key={id}
            controls
            preload="none"
            playsInline
            poster={`/media/${id}.jpg`}
            className="aspect-video w-full rounded-ui border border-line bg-sunken"
          >
            <source src={`/media/${id}.mp4`} type="video/mp4" />
            <a href={`/media/${id}.mp4`}>Download the video</a>
          </video>
          <figcaption className="mt-3 max-w-[80ch] text-[15px] leading-relaxed text-muted">{v.about} Captions are burned in.</figcaption>
        </figure>
      </Reveal>
    </Section>
  );
}
