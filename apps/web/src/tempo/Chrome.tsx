import { ArrowUpRight } from '@phosphor-icons/react';
import { DEMO, EXPLORER, GITHUB, VAULT } from './config';
import { WRAP } from './kit';

// Shared by the landing, onboarding and pay pages. One radius, one accent, hairlines over boxes (see DESIGN.md).
export const linkCls = 'text-accent-text underline underline-offset-2 hover:no-underline';
export const primaryBtn =
  'inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-ui bg-accent px-4 text-[15px] font-semibold text-accent-ink ' +
  'transition-transform duration-150 ease-ledger hover:brightness-105 active:translate-y-px';
export const quietBtn =
  'inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-ui border border-line-strong px-4 text-[15px] font-semibold ' +
  'transition-colors duration-150 ease-ledger hover:bg-surface active:translate-y-px';

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#calculator', label: 'Calculator' },
  { href: '#proof', label: 'On-chain' },
  { href: '#faq', label: 'FAQ' },
];

// `sections` is true on the landing page, where the links are in-page anchors; elsewhere they lead back to it.
// `hideStart` drops the Get started button on the onboarding page itself.
export function SiteHeader({ sections = false, hideStart = false }: { sections?: boolean; hideStart?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className={`${WRAP} flex h-16 items-center justify-between gap-6`}>
        <a href="/" className="flex shrink-0 items-center gap-3">
          <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight">Hisab</span>
          <span className="font-deva text-base text-muted">हिसाब</span>
        </a>
        <nav className="flex items-center gap-7 text-[15px]">
          {NAV.map((n) => (
            <a key={n.href} href={sections ? n.href : `/${n.href}`} className="hidden text-muted transition-colors hover:text-text lg:inline">
              {n.label}
            </a>
          ))}
          <a href={GITHUB} className="hidden items-center gap-1 text-muted transition-colors hover:text-text sm:inline-flex">
            GitHub <ArrowUpRight size={16} aria-hidden />
          </a>
          {!hideStart && (
            <a href="/start" className={`${primaryBtn} h-10`}>
              Get started
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

const FOOT = [
  {
    title: 'Product',
    links: [
      { href: '/#how', label: 'How it works' },
      { href: '/#calculator', label: 'Calculator' },
      { href: '/start', label: 'Get started' },
      { href: `/pay/${DEMO.sbHash}`, label: 'Demo pay page' },
    ],
  },
  {
    title: 'Proof',
    links: [
      { href: `${EXPLORER}/address/${VAULT}`, label: 'View on explorer' },
      { href: `${GITHUB}/blob/main/contracts/contracts/tempo/SettlementVault.sol`, label: 'Vault contract' },
      { href: GITHUB, label: 'GitHub' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: '/#pitch', label: 'Watch the pitch' },
      { href: '/#roadmap', label: 'Roadmap' },
      { href: '/console', label: 'Local console' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className={`${WRAP} grid gap-10 py-14 md:grid-cols-[5fr_7fr]`}>
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-xl font-semibold tracking-tight">Hisab on Tempo</span>
          </div>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-muted">
            A testnet build for the Colosseum Crypto World&apos;s Fair, Tempo track. No real money moves here.
          </p>
          <p className="mt-4 max-w-[44ch] text-[13px] leading-relaxed text-muted">
            Hisab began as a DRUNIX Hackathon entry (NPCI and Citi) in September 2026.{' '}
            <a className={linkCls} href="https://github.com/Bhavya-Dhoot/Hisab">Original repository</a> by Bhavya Dhoot.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOT.map((col) => (
            <div key={col.title}>
              <div className="text-[13px] font-semibold">{col.title}</div>
              <ul className="mt-3 space-y-2.5 text-[15px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a className="text-muted transition-colors hover:text-text" href={l.href}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
