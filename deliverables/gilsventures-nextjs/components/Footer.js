import Image from 'next/image';
import Link from 'next/link';
import { company } from '@/lib/site-data';

const links = [
  ['Services', '/services/'],
  ['Projects', '/projects/'],
  ['About', '/about/'],
  ['Service Areas', '/service-areas/'],
  ['Contact', '/contact/'],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Image src="/images/logo.jpg" alt="Gil's Ventures, LLC logo" width={180} height={70} />
          <p className="footer-tagline">Residential, commercial, federal roofing, and custom sheet metal across the Borderland.</p>
          <p>Family-owned, El Paso-based since 1981.</p>
        </div>
        <div>
          <h3>Navigation</h3>
          <ul className="footer-links">
            {links.map(([label, href]) => (
              <li key={href}><Link href={href}>{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Contact</h3>
          <ul className="footer-contact">
            <li><a href={company.phonePrimaryHref}>{company.phonePrimary} (Gilbert)</a></li>
            <li><a href={company.phoneSecondaryHref}>{company.phoneSecondary} (Carlos)</a></li>
            <li><a href={`mailto:${company.emailPrimary}`}>{company.emailPrimary}</a></li>
            <li><a href={`mailto:${company.emailSecondary}`}>{company.emailSecondary}</a></li>
            <li>{company.address}</li>
            <li>{company.hours}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© 2026 Gil&apos;s Ventures, LLC. All rights reserved.</span>
          <span>Licensed in New Mexico · Bonded · General Liability + Workers&apos; Compensation</span>
        </div>
      </div>
    </footer>
  );
}
