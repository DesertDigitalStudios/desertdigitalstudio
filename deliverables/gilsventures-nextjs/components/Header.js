'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { company } from '@/lib/site-data';

const navLinks = [
  { href: '/services/', label: 'Services' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/service-areas/', label: 'Service Areas' },
  { href: '/contact/', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="header-logo" aria-label="Gil's Ventures home">
            <Image src="/images/logo.jpg" alt="Gil's Ventures, LLC logo" width={180} height={70} priority />
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <a href={company.phonePrimaryHref} className="phone-link">{company.phonePrimary}</a>
            <Link href="/contact/" className="btn btn-primary">Get a Free Estimate</Link>
            <button className="menu-toggle" type="button" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </div>
      </header>
      <div className={`mobile-drawer-wrap ${open ? 'open' : ''}`} aria-hidden={!open}>
        <button className="mobile-drawer-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close menu" />
        <aside className="mobile-drawer">
          <button className="drawer-close" type="button" onClick={() => setOpen(false)} aria-label="Close menu">×</button>
          <Link href="/" className="header-logo drawer-logo" onClick={() => setOpen(false)}>
            <Image src="/images/logo.jpg" alt="Gil's Ventures, LLC logo" width={170} height={66} />
          </Link>
          <nav className="mobile-nav" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
            ))}
          </nav>
          <div className="mobile-drawer-cta">
            <a href={company.phonePrimaryHref} className="phone-link">Call {company.phonePrimary}</a>
            <Link href="/contact/" className="btn btn-primary" onClick={() => setOpen(false)}>Get a Free Estimate</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
