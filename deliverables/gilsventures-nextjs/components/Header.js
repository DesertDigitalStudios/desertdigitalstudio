'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NAV = [
  { label: 'Services', href: '/services/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">
        <Link href="/" className="header-logo" aria-label="Gil's Ventures home">
          <Image
            src="/images/logo.jpg"
            alt="Gil's Ventures, LLC logo"
            width={210}
            height={68}
            style={{ width: '210px', height: 'auto' }}
            priority
          />
        </Link>

        <div className="header-right">
          <nav className="nav" aria-label="Main navigation">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="nav-link">
                {n.label}
              </Link>
            ))}
          </nav>

          <a href="tel:+19152743835" className="header-phone">
            📞 (915) 274-3835
          </a>

          <Link href="/contact/" className="btn btn-primary" style={{ minHeight: '44px', padding: '0 1.15rem', fontSize: '0.9rem' }}>
            Get a Quote
          </Link>

          <button
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            <span style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : undefined }} />
            <span style={{ opacity: open ? 0 : 1 }} />
            <span style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : undefined }} />
          </button>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(255,255,255,0.98)',
            borderTop: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            padding: '1rem 1.25rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="nav-link"
              onClick={() => setOpen(false)}
              style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}
            >
              {n.label}
            </Link>
          ))}
          <a
            href="tel:+19152743835"
            className="btn btn-outline"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setOpen(false)}
          >
            Call (915) 274-3835
          </a>
          <Link href="/contact/" className="btn btn-primary" onClick={() => setOpen(false)}>
            Get a Free Quote
          </Link>
        </div>
      )}
    </header>
  );
}
