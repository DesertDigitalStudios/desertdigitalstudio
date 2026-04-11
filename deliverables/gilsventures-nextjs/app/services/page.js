import Link from 'next/link';
import { services, certifications } from '../../lib/site-data';
import Image from 'next/image';

export const metadata = {
  title: 'Services',
  description: "Commercial roofing, residential roofing, restorations, metal systems, and sheet metal services from Gil's Ventures in El Paso.",
};

export default function ServicesPage() {
  return (
    <main>
      <section className="section" style={{ background: 'var(--off-white)', paddingTop: '7rem' }}>
        <div className="container">
          <span className="eyebrow">Services</span>
          <h1 className="section-title" style={{ maxWidth: '760px' }}>
            Roofing and sheet metal services backed by decades of field experience
          </h1>
          <p className="section-body" style={{ maxWidth: '760px' }}>
            We have skilled employees and foremen that can clearly identify and diagnose your roof needs, with work spanning residential, commercial, federal, and public-sector projects across the Borderland.
          </p>
        </div>
      </section>

      <section className="section services-section">
        <div className="container">
          <div className="services-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {services.map((service) => (
              <article key={service.title} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h2 className="service-title">{service.title}</h2>
                <p className="service-body">{service.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section certs-section">
        <div className="container">
          <div className="section-intro-row">
            <div>
              <span className="eyebrow">Systems & manufacturers</span>
              <h2 className="section-title">Certified Applicators of Versico, Weather Stop, Duro-Last, and CertainTeed</h2>
            </div>
            <p className="section-body">
              Certified applicator recognition helps reinforce material familiarity, installation credibility, and confidence in the systems Gil&apos;s Ventures installs.
            </p>
          </div>
          <div className="certs-grid">
            {certifications.map((c) => (
              <div key={c.alt} className="cert-card">
                <div className="cert-card-inner">
                  <Image src={c.src} alt={c.alt} width={180} height={68} style={{ objectFit: 'contain', maxHeight: '68px', width: 'auto' }} />
                  <span className="cert-name">{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container contact-inner">
          <div className="contact-cta">
            <div>
              <span className="eyebrow eyebrow-light">Need a quote?</span>
              <h2 className="section-title light">Tell us about the project</h2>
              <p className="section-body light">
                Whether it's a roof replacement, restoration, federal scope, or custom sheet metal work, Gil's Ventures can review the job and point you in the right direction.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link href="/contact/" className="btn btn-primary">Request an estimate</Link>
              <a href="tel:+19152743835" className="btn btn-outline-light">Call Gilbert</a>
            </div>
          </div>
          <div className="contact-details-grid">
            <div className="contact-detail-item">
              <p className="contact-detail-label">Primary Contact</p>
              <p className="contact-detail-value">Gilbert Gil<br /><a href="tel:+19152743835">(915) 274-3835</a></p>
            </div>
            <div className="contact-detail-item">
              <p className="contact-detail-label">Secondary Contact</p>
              <p className="contact-detail-value">Carlos Gil<br /><a href="tel:+19158209263">(915) 820-9263</a></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
