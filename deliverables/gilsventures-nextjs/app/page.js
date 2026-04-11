import Image from 'next/image';
import Link from 'next/link';
import { services, featuredProjects, galleryItems, certifications } from '../lib/site-data';

export const metadata = {
  title: "Gil's Ventures, LLC | Commercial & Residential Roofing — El Paso, TX",
  description:
    "Gil's Ventures brings 30+ years of roofing expertise to commercial, residential, and federal projects across El Paso and the Borderland. Licensed, bonded, and built on results.",
};

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-bg">
          <Image
            src="/images/hero-aerial.jpg"
            alt="Aerial roofing project by Gil's Ventures in the El Paso area"
            fill
            priority
            quality={92}
            style={{ objectFit: 'cover', objectPosition: 'center 38%' }}
          />
        </div>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            El Paso, TX · Sunland Park, NM · Fort Bliss
          </div>
          <h1 className="hero-title">
            Built right.<br />
            <em>Every time.</em>
          </h1>
          <p className="hero-subtitle">
            Trusted by homeowners, commercial clients, and federal facilities across the Borderland for
            roofing systems, restoration work, sheet metal fabrication, and complex project execution.
          </p>
          <div className="hero-actions">
            <Link href="/contact/" className="btn btn-primary">
              Request a Free Estimate
            </Link>
            <a href="tel:+19152743835" className="btn btn-outline-light">
              Call (915) 274-3835
            </a>
          </div>
          <div className="hero-trust">
            <div className="hero-trust-item">
              <span className="hero-trust-value">30+</span>
              <span className="hero-trust-label">Years Experience</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-value">20-Year</span>
              <span className="hero-trust-label">Fort Bliss IDIQ</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-value">Federal</span>
              <span className="hero-trust-label">Military + Public Work</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-value">Bonded</span>
              <span className="hero-trust-label">Licensed & Insured</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container">
          <div className="trust-strip">
            <div className="trust-item">
              <span className="trust-num">Fort Bliss</span>
              <span className="trust-text">IDIQ Sub-Contractor, 20+ years</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">Federal</span>
              <span className="trust-text">CBP, Military & State Contracts</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">NM Licensed</span>
              <span className="trust-text">Licensed in New Mexico</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">Family-Owned</span>
              <span className="trust-text">El Paso-based since 1981</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="services-header">
            <div>
              <span className="eyebrow">What we do</span>
              <h2 className="section-title">Roofing built for the long run</h2>
            </div>
            <div>
              <p className="section-body">
                From single-family homes to military installations, Gil's Ventures brings the same level of craft,
                accountability, and field-tested experience to every project.
              </p>
              <Link href="/services/" className="btn btn-ghost-accent" style={{ marginTop: '1.25rem' }}>
                See all services →
              </Link>
            </div>
          </div>
          <div className="services-grid">
            {services.slice(0, 4).map((s) => (
              <article key={s.title} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-body">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="feature-section">
        <div className="feature-inner">
          <div className="feature-image">
            <Image
              src="/images/cbp-standing-seam.jpg"
              alt="Fort Bliss and Customs Border Protection roofing project by Gil's Ventures"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className="feature-image-overlay" />
          </div>
          <div className="feature-copy">
            <div>
              <span className="eyebrow eyebrow-light">Proven at scale</span>
              <h2 className="section-title light" style={{ marginBottom: '1.25rem' }}>
                Military and federal projects done right
              </h2>
              <p className="section-body light">
                Gil's Ventures has been a primary roofing contractor at Fort Bliss for over 20 years, handling
                everything from re-roofs and restorations to full HVAC integration and custom catwalk systems.
              </p>
            </div>
            <ul className="feature-cred-list">
              {[
                '20-year Fort Bliss IDIQ sub-contractor',
                'New roof systems for Customs and Border Protection',
                'Restoration projects for Clint Independent School District',
                'Housing Authority of El Paso projects',
                'Standing seam metal, TPO, BUR, SBS, and shingle systems',
              ].map((item) => (
                <li key={item} className="feature-cred-item">
                  <span className="feature-cred-dot" />
                  {item}
                </li>
              ))}
            </ul>
            <div>
              <Link href="/projects/" className="btn btn-outline-light">
                View project gallery →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section featured-grid-section">
        <div className="container">
          <div className="section-intro-row">
            <div>
              <span className="eyebrow">Signature work</span>
              <h2 className="section-title">Projects that show the range of the company</h2>
            </div>
            <p className="section-body">
              He already has the kind of project history that should make people feel confident fast. The site should surface that immediately.
            </p>
          </div>
          <div className="featured-projects-grid">
            {featuredProjects.map((project) => (
              <article key={project.title} className="featured-project-card">
                <div className="featured-project-media">
                  <Image src={project.image} alt={project.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="featured-project-copy">
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm certs-section">
        <div className="container">
          <div className="certs-header">
            <span className="eyebrow">Certified applicators</span>
            <h2 className="section-title" style={{ fontSize: '1.75rem' }}>
              Manufacturer-certified for the systems we install
            </h2>
          </div>
          <div className="certs-grid">
            {certifications.map((c) => (
              <div key={c.alt} className="cert-card">
                <Image src={c.src} alt={c.alt} width={180} height={68} style={{ objectFit: 'contain', maxHeight: '68px', width: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section gallery-section" id="projects">
        <div className="container">
          <div className="gallery-header">
            <div>
              <span className="eyebrow">Recent work</span>
              <h2 className="section-title">The work speaks for itself</h2>
            </div>
            <Link href="/projects/" className="btn btn-outline" style={{ flexShrink: 0 }}>
              Full gallery →
            </Link>
          </div>
          <div className="gallery-grid">
            {galleryItems.slice(0, 6).map((item, index) => (
              <figure key={item.src} className={`gallery-item gi-${index + 1}`} style={{ margin: 0 }}>
                <Image src={item.src} alt={item.alt} fill style={{ objectFit: 'cover' }} />
                <div className="gallery-item-caption">{item.caption}</div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="container about-inner">
          <div className="about-images">
            <div className="about-img-main">
              <Image
                src="/images/restoration.jpg"
                alt="Gil's Ventures restoration project"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="about-img-badge">
              <strong>1981</strong>
              <span>Est. in El Paso</span>
            </div>
          </div>

          <div className="about-copy">
            <div>
              <span className="eyebrow">Our story</span>
              <h2 className="section-title">
                Generations of craftsmanship from a family that knows El Paso roofs
              </h2>
            </div>
            <p className="about-body">
              Carlos Gil of Gil&apos;s Ventures began his roofing career in 1981, working for and heading the work crews of his father&apos;s company. Having roofed most of El Paso&apos;s homes built from the early-1980&apos;s on, you will still see the Spanish tile homes, built-up roofs, and shingle homes that Carlos roofed still standing today.
            </p>
            <p className="about-body">
              Twenty-three years ago Carlos decided to venture out on his own, and started his own roofing and sheet metal company. Almost immediately, Gil&apos;s Ventures became a primary roofer of all new and old buildings located at Ft. Bliss Military Installation.
            </p>
            <ul className="about-credentials">
              {[
                'Family-owned and operated',
                'Licensed in New Mexico',
                'Bonded for your protection',
                'General Liability Insurance',
                "Workers' Compensation policy",
                'Residential + commercial + federal experience',
              ].map((item) => (
                <li key={item} className="about-cred">{item}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <Link href="/about/" className="btn btn-ghost-accent">
                More about us →
              </Link>
              <Link href="/contact/" className="btn btn-primary">
                Request an estimate
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section contact-section" id="contact">
        <div className="container contact-inner">
          <div className="contact-cta">
            <div>
              <span className="eyebrow eyebrow-light">Get in touch</span>
              <h2 className="section-title light" style={{ marginBottom: '1rem' }}>
                Ready to talk about your project?
              </h2>
              <p className="section-body light">
                Whether it's a new residential roof, a commercial re-roof, restoration work, or a federal project estimate, reach out directly and the team can review the scope with you.
              </p>
            </div>

            <div className="contact-phones">
              <div className="contact-phone-row">
                <span className="contact-phone-label">Gilbert</span>
                <a href="tel:+19152743835" className="contact-phone-num">(915) 274-3835</a>
              </div>
              <div className="contact-phone-row">
                <span className="contact-phone-label">Carlos</span>
                <a href="tel:+19158209263" className="contact-phone-num">(915) 820-9263</a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <a href="tel:+19152743835" className="btn btn-primary">Call now</a>
              <a href="mailto:gilbertgil@gmail.com" className="btn btn-outline-light">
                Send an email
              </a>
            </div>
          </div>

          <div className="contact-details-grid">
            <div className="contact-detail-item">
              <p className="contact-detail-label">Office Address</p>
              <p className="contact-detail-value">250 Quinella<br />Sunland Park, NM 88063</p>
            </div>
            <div className="contact-detail-item">
              <p className="contact-detail-label">Business Hours</p>
              <p className="contact-detail-value">Monday – Friday<br />6:00 am – 3:00 pm</p>
            </div>
            <div className="contact-detail-item">
              <p className="contact-detail-label">Email</p>
              <p className="contact-detail-value">
                <a href="mailto:gilbertgil@gmail.com">gilbertgil@gmail.com</a><br />
                <a href="mailto:gilsventures03@gmail.com">gilsventures03@gmail.com</a>
              </p>
            </div>
            <div className="contact-detail-item">
              <p className="contact-detail-label">Service Area</p>
              <p className="contact-detail-value">El Paso, TX · Sunland Park, NM<br />Fort Bliss · The Borderland</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
