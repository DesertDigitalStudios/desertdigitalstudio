import Image from 'next/image';
import Link from 'next/link';
import { galleryItems } from '@/lib/site-data';

export const metadata = {
  title: 'Project Gallery | Commercial & Residential Roofing — Gil\'s Ventures',
  description: 'Browse Gil\'s Ventures project gallery — including federal, commercial, and residential roofing work across El Paso, Fort Bliss, and the Borderland.',
};

const categories = ['Federal / Government Projects', 'Commercial Roofing', 'Residential Roofing', 'Metal & Sheet Metal'];

export default function ProjectsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Projects</span>
          <h1>Project Gallery, Commercial, Residential &amp; Federal Roofing</h1>
          <p className="section-intro">From Fort Bliss and CBP-related work to apartment communities, custom homes, and metal packages, Gil&apos;s Ventures brings range and consistency to every scope.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {categories.map((category) => (
            <div key={category} className="gallery-section">
              <h2 className="section-title">{category}</h2>
              <div className="gallery-grid">
                {galleryItems.filter((item) => item.category === category).map((item) => (
                  <article key={item.src} className="gallery-card">
                    <Image src={item.src} alt={item.alt} width={900} height={675} />
                    <div className="gallery-copy">
                      <h3>{item.caption}</h3>
                      <p>{item.alt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2 className="section-title">Have a project that needs a dependable roofing partner?</h2>
            <p>Let&apos;s talk through the scope, access requirements, and schedule.</p>
          </div>
          <Link href="/contact/" className="btn btn-primary">Start Your Estimate</Link>
        </div>
      </section>
    </>
  );
}
