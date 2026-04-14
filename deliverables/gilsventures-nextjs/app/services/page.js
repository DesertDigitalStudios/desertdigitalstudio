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
          {services.map((service) => (
            <article key={service.slug} className="service-row service-card">
              <div className="service-icon">{service.icon}</div>
              <div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul>
                  {service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <Link href="/contact/" className="btn btn-outline">Talk About This Service</Link>
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
