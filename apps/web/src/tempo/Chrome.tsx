import { ArrowUpRight } from '@phosphor-icons/react';
import { EXPLORER, GITHUB } from './config';

// Shared by the landing and pay pages. One radius, one accent, hairlines over boxes (see DESIGN.md).
export const linkCls = 'text-accent-text underline underline-offset-2 hover:no-underline';
export const primaryBtn =
  'inline-flex h-11 items-center gap-2 rounded-ui bg-accent px-4 text-[15px] font-semibold text-accent-ink ' +
  'transition-transform duration-150 ease-ledger hover:brightness-105 active:translate-y-px';
export const quietBtn =
  'inline-flex h-11 items-center gap-2 rounded-ui border border-line-strong px-4 text-[15px] font-semibold ' +
  'transition-colors duration-150 ease-ledger hover:bg-surface active:translate-y-px';

export function SiteHeader({ sections = false }: { sections?: boolean }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight">Hisab</span>
          <span className="font-deva text-lg text-muted">हिसाब</span>
        </a>
        <nav className="flex items-center gap-6 text-sm">
          {sections && (
            <>
              <a href="#how" className="hidden text-muted hover:text-text md:inline">How it works</a>
              <a href="#proof" className="hidden text-muted hover:text-text md:inline">On-chain</a>
            </>
          )}
          <a href={GITHUB} className="inline-flex items-center gap-1 font-medium hover:text-accent-text">
            GitHub <ArrowUpRight size={14} weight="bold" aria-hidden />
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] text-muted md:flex-row md:items-baseline md:justify-between">
        <p className="max-w-[60ch]">
          Hisab began as a DRUNIX Hackathon entry (NPCI and Citi) in September 2026. Original repository by Bhavya Dhoot.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li><a className={linkCls} href={GITHUB}>GitHub</a></li>
          <li><a className={linkCls} href={EXPLORER}>Tempo explorer</a></li>
          <li><a className={linkCls} href="/console">/console</a> (local console, needs API)</li>
        </ul>
      </div>
    </footer>
  );
}
