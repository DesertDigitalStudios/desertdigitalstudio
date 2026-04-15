import Image from 'next/image';
import Link from 'next/link';
import { certifications, company, featuredProjects, serviceAreas, services } from '@/lib/site-data';

export const metadata = {
  title: "El Paso Roofing Contractor | Gil's Ventures, LLC",
  description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, and federal roofing. Licensed in NM. Call (915) 274-3835.",
};

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy hero-copy-tight">
            <h1>El Paso roofing done right.</h1>
            <p>Residential, commercial, federal, and sheet metal roofing backed by 40+ years of field experience.</p>
            <div className="hero-actions">
              <Link href="/contact/" className="btn btn-primary">Request a Free Estimate</Link>
              <a href={company.phonePrimaryHref} className="btn btn-outline-light">Call {company.phonePrimary}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container trust-grid">
          <div className="trust-item"><strong>40+ Years</strong><span>Roofing experience dating back to 1981</span></div>
          <div className="trust-item"><strong>10 Certifications</strong><span>Recognized applicator and manufacturer affiliations</span></div>
          <div className="trust-item"><strong>Federal Experience</strong><span>Fort Bliss, CBP, and public-sector project support</span></div>
          <div className="trust-item"><strong>Free Estimates</strong><span>Call, email, or send project details for a fast next step</span></div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Services</span>
          <h2 className="section-title">Roofing systems built for homes, facilities, and demanding job sites</h2>
          <div className="cards-grid">
            {services.map((service) => (
              <article key={service.slug} className="service-card service-card-serious">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="service-card-list">
                  {service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <Link href="/contact/" className="service-link">Talk with Gil&apos;s Ventures</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-section split-section-proof">
          <div className="proof-panel">
            <div className="proof-stat">
              <strong>Family</strong>
              <span>Family-owned contractor serving the Borderland with local accountability</span>
            </div>
            <div className="proof-stat">
              <strong>20+</strong>
              <span>Years supporting federal and public-sector work</span>
            </div>
            <div className="proof-stat">
              <strong>10</strong>
              <span>Manufacturer certifications and applicator affiliations</span>
            </div>
            <div className="proof-stat">
              <strong>NM</strong>
              <span>Licensed, bonded, and insured for protected project delivery</span>
            </div>
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
          <h2 className="section-title">A stronger trust story than the usual contractor site</h2>
          <div className="award-badge-row">
            <Image src="/images/tile-roof.jpg" alt="2024 Best of the Border Community's Choice Award — Winner" width={180} height={180} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <p className="award-badge-text">Voted <strong>Best of the Border 2024</strong> by the El Paso community, with a project history that spans homes, multifamily properties, commercial scopes, and public-sector work.</p>
          </div>
          <div className="trust-proof-shell">
            <div className="trust-proof-main">
              <h3>What gives owners confidence to call</h3>
              <p>Gil&apos;s Ventures combines long-term field experience, manufacturer-backed systems, and local accountability. That means clearer communication, better fit-for-scope recommendations, and a contractor that can handle both everyday roofing work and more demanding commercial or federal conditions.</p>
              <ul className="trust-proof-list">
                <li>Family-owned, locally accountable service</li>
                <li>Licensed in New Mexico, bonded, and insured</li>
                <li>Residential, commercial, sheet metal, and federal capability</li>
                <li>Real project gallery with named work across multiple scope types</li>
              </ul>
            </div>
            <div className="trust-proof-side">
              {[
                ['Fast estimate path', 'Call, email, or submit project details for the next step.'],
                ['Documented capability', 'Trusted for projects that need coordination, access, and reliability.'],
                ['Borderland coverage', 'Serving El Paso, Sunland Park, Las Cruces, and nearby communities.'],
              ].map(([title, text]) => (
                <article key={title} className="trust-mini-card">
                  <h4>{title}</h4>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="reasons-grid">
            {[
              ['01', 'Proven systems', 'Experience across shingle, tile, TPO, standing seam, repairs, and restoration.'],
              ['02', 'Reliable coordination', 'Clear communication for homeowners, property managers, and public-sector stakeholders.'],
              ['03', 'Protected work', 'Licensed in New Mexico, bonded, and backed by general liability plus workers’ compensation coverage.'],
              ['04', 'Family-owned accountability', 'A local team whose name stays tied to every finished roof.'],
            ].map(([number, title, text]) => (
              <article key={title} className="reason-card reason-card-serious">
                <div className="reason-kicker">{number}</div>
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
