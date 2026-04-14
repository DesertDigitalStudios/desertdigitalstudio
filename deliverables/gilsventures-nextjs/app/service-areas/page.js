import Link from 'next/link';
import { serviceAreas } from '@/lib/site-data';

export const metadata = {
  title: 'Roofing Service Areas | El Paso, Sunland Park & the Borderland',
  description: 'Gil\'s Ventures serves El Paso, Sunland Park, Fort Bliss, Las Cruces, Anthony, Horizon City, Socorro, and communities throughout the Borderland region.',
  alternates: { canonical: '/service-areas/' },
};

export default function ServiceAreasPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Service Areas</span>
          <h1>Roofing Services Across El Paso &amp; the Borderland</h1>
          <p className="section-intro">Gil&apos;s Ventures serves property owners, managers, and facility teams across El Paso and surrounding communities with roofing systems built for desert weather, long-term durability, and responsive service.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="areas-grid cards-grid">
            {serviceAreas.map((area) => (
              <article key={area.name} className="area-card">
                <h3>{area.name}</h3>
                <p>{area.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2 className="section-title">Not sure if your project is in range?</h2>
            <p>Reach out with the address and project type, and we&apos;ll let you know how we can help.</p>
          </div>
          <Link href="/contact/" className="btn btn-primary">Ask About Your Area</Link>
        </div>
      </section>
    </>
  );
}
