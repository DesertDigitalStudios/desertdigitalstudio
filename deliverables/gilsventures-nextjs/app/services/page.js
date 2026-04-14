import Link from 'next/link';
import Image from 'next/image';
import { certifications, services } from '@/lib/site-data';

export const metadata = {
  title: 'Roofing Services in El Paso, TX | Gil\'s Ventures',
  description: 'From residential shingle and tile to commercial TPO, metal roofing, sheet metal, and federal projects, Gil\'s Ventures covers roofing needs across El Paso and the Borderland.',
  alternates: { canonical: '/services/' },
};

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Services</span>
          <h1>Roofing &amp; Construction Services in El Paso, TX</h1>
          <p className="section-intro">As an El Paso roofing contractor with decades of field experience, Gil&apos;s Ventures handles residential replacements, commercial systems, federal scopes, sheet metal work, and responsive repairs across the Borderland.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="services-proof-strip">
            <div><strong>Residential</strong><span>Shingle, tile, metal, reroofs, and repairs</span></div>
            <div><strong>Commercial</strong><span>TPO, low-slope systems, apartments, and retail scopes</span></div>
            <div><strong>Federal</strong><span>Experience with CBP, Fort Bliss-related work, and public projects</span></div>
            <div><strong>Sheet Metal</strong><span>Flashing, coping, gutters, downspouts, and specialty details</span></div>
          </div>
          {services.map((service) => (
            <article key={service.slug} className="service-row service-card">
              <div>
                <div className="service-row-top">
                  <span className="service-row-badge">Service Scope</span>
                  <h2>{service.title}</h2>
                </div>
                <p>{service.description}</p>
                <ul>
                  {service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <div className="service-row-actions">
                  <Link href="/contact/" className="btn btn-outline">Talk About This Service</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Certified Systems</span>
          <h2 className="section-title">Manufacturer-backed experience across leading roofing products</h2>
          <div className="cert-grid">
            {certifications.map((cert) => (
              <div key={cert.name} className="cert-card"><Image src={cert.src} alt={cert.alt} width={180} height={80} /></div>
            ))}
          </div>
        </div>
      </section>
      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2 className="section-title">Ready to scope your roofing project?</h2>
            <p>We&apos;ll review your roof type, timeline, and goals, then help you plan the right next step.</p>
          </div>
          <Link href="/contact/" className="btn btn-primary">Request a Free Estimate</Link>
        </div>
      </section>
    </>
  );
}
