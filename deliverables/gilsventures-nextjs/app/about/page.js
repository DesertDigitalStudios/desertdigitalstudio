import Image from 'next/image';
import Link from 'next/link';
import { certifications } from '@/lib/site-data';

export const metadata = {
  title: 'About Gil\'s Ventures | 40+ Years of El Paso Roofing',
  description: 'Learn about Gil\'s Ventures, a family-owned roofing company with 40+ years of field experience serving El Paso, Sunland Park, and the Borderland.',
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">About</span>
          <h1>About Gil&apos;s Ventures, 40+ Years in El Paso Roofing</h1>
          <p className="section-intro">Gil&apos;s Ventures is a family-owned roofing and sheet metal contractor built on decades of hands-on experience, long-standing client trust, and practical jobsite leadership across the Borderland.</p>
        </div>
      </section>
      <section className="section">
        <div className="container about-grid">
          <div className="content-block">
            <h2 className="section-title">Carlos built this company the old-fashioned way, by doing the work right</h2>
            <p>Carlos started in roofing in 1981 and spent years learning the trade from the field up. That experience shaped Gil&apos;s Ventures into a company that understands what lasting workmanship looks like, how crews should move on site, and why details matter on every roof system.</p>
            <p>Over time, the company expanded beyond residential work into commercial roofing, custom sheet metal, restoration, and federal scopes. Today, Gil&apos;s Ventures is known for practical solutions, responsive communication, and a willingness to handle both straightforward reroofs and more demanding project environments.</p>
          </div>
          <div className="content-media">
            <Image src="/images/metal-roof-1.jpg" alt="Metal roofing installation completed by Gil's Ventures" width={900} height={700} />
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="container">
          <span className="eyebrow">Timeline</span>
          <div className="cards-grid">
            {[
              ['1981', 'Carlos enters the roofing trade and begins building his experience in the El Paso market.'],
              ['Early 2000s', 'Gil’s Ventures is established to serve residential and commercial clients across the Borderland.'],
              ['20+ years', 'Federal project experience grows through work connected to Fort Bliss and other public-sector scopes.'],
            ].map(([year, text]) => (
              <article key={year} className="timeline-card">
                <h3>{year}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <span className="eyebrow">Certifications</span>
          <h2 className="section-title">Certified applicator relationships that support quality installs</h2>
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
            <h2 className="section-title">Need a contractor with real experience behind the name?</h2>
            <p>Call Gilbert or Carlos directly, or send over your project details for a free estimate.</p>
          </div>
          <Link href="/contact/" className="btn btn-primary">Contact Gil&apos;s Ventures</Link>
        </div>
      </section>
    </>
  );
}
