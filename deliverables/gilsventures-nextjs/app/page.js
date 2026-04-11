import Image from 'next/image';
import Link from 'next/link';
import { certifications, featuredProjects, serviceAreas, services } from '@/lib/site-data';

export const metadata = {
  title: "El Paso Roofing Contractor | Gil's Ventures, LLC",
  description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, and federal roofing. Licensed in NM. Call (915) 274-3835.",
};

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Licensed in New Mexico • Bonded • Insured</span>
            <h1>El Paso&apos;s Trusted Roofing Contractor, Built to Last Since 1981</h1>
            <p>Gil&apos;s Ventures delivers residential, commercial, federal, and sheet metal roofing work backed by decades of Borderland experience and a reputation for showing up, solving problems, and finishing strong.</p>
            <div className="hero-actions">
              <Link href="/contact/" className="btn btn-primary">Get a Free Estimate</Link>
              <Link href="/projects/" className="btn btn-outline-light">View Recent Projects</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container trust-grid">
          <div className="trust-item"><strong>40+ Years</strong><span>Carlos started roofing in 1981</span></div>
          <div className="trust-item"><strong>20+ Years</strong><span>Company track record since the early 2000s</span></div>
          <div className="trust-item"><strong>Federal Experience</strong><span>Fort Bliss and government project support</span></div>
          <div className="trust-item"><strong>Borderland Coverage</strong><span>El Paso, Sunland Park, Las Cruces, and beyond</span></div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Services</span>
          <h2 className="section-title">Roofing systems built for homes, facilities, and demanding job sites</h2>
          <div className="cards-grid">
            {services.map((service) => (
              <article key={service.slug} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-section">
          <div className="content-media">
            <Image src="/images/restoration.jpg" alt="Gil's Ventures crew performing roof restoration work" width={900} height={700} />
          </div>
          <div className="content-block">
            <span className="eyebrow">About Gil&apos;s Ventures</span>
            <h2 className="section-title">A family roofing company shaped by real field experience</h2>
            <p>Carlos began working in roofing in 1981 and built his reputation through consistent, hands-on work across El Paso and the surrounding region. Gil&apos;s Ventures grew from that foundation into a contractor trusted for residential reroofs, commercial systems, sheet metal packages, and federal scopes that demand coordination and reliability.</p>
            <p>From neighborhood homes to Fort Bliss and CBP-related work, the company brings the same mindset to every project: install the right system, communicate clearly, and leave the roof better than expected.</p>
            <Link href="/about/" className="btn btn-outline">Learn More About Our Team</Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Featured Projects</span>
          <h2 className="section-title">Work that reflects range, scale, and craftsmanship</h2>
          <div className="projects-grid">
            {featuredProjects.slice(0, 4).map((project) => (
              <article key={project.title} className="project-card">
                <div className="project-image">
                  <Image src={project.image} alt={project.description} width={900} height={650} />
                </div>
                <div className="project-copy">
                  <span>{project.category}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Why Gil&apos;s Ventures</span>
          <h2 className="section-title">The kind of contractor owners and managers want on site</h2>
          <div className="award-badge-row">
            <Image src="/images/tile-roof.jpg" alt="2024 Best of the Border Community's Choice Award — Winner" width={180} height={180} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <p className="award-badge-text">Voted <strong>Best of the Border 2024</strong> by the El Paso community — a recognition earned through consistent workmanship and customer trust.</p>
          </div>
          <div className="reasons-grid">
            {[
              ['🧱', 'Proven systems', 'Experience across shingle, tile, TPO, standing seam, repairs, and restoration.'],
              ['📋', 'Reliable coordination', 'Clear communication for homeowners, property managers, and public-sector stakeholders.'],
              ['🛡️', 'Protected work', 'Licensed in New Mexico, bonded, and backed by general liability plus workers’ compensation coverage.'],
              ['🤝', 'Family-owned accountability', 'A local team whose name stays tied to every finished roof.'],
            ].map(([icon, title, text]) => (
              <article key={title} className="reason-card">
                <div className="reason-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Manufacturers</span>
          <h2 className="section-title">Certified Applicators Of</h2>
          <div className="cert-grid">
            {certifications.map((cert) => (
              <div key={cert.name} className="cert-card">
                <Image src={cert.src} alt={cert.alt} width={180} height={80} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Service Areas</span>
          <h2 className="section-title">Serving El Paso and the Borderland with dependable roofing support</h2>
          <div className="area-list">
            {serviceAreas.map((area) => <div key={area.name} className="area-pill">{area.name}</div>)}
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <span className="eyebrow">Free Estimate</span>
            <h2 className="section-title">Need pricing on a reroof, repair, or sheet metal scope?</h2>
            <p>Tell us about the property and project type, and we&apos;ll help you get the next step moving quickly.</p>
          </div>
          <Link href="/contact/" className="btn btn-primary">Request an Estimate</Link>
        </div>
      </section>
    </>
  );
}
