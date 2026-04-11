import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'About',
  description: "Learn more about Gil's Ventures, a family-owned roofing and sheet metal contractor serving El Paso, Fort Bliss, and the Borderland for decades.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="section" style={{ background: 'var(--off-white)', paddingTop: '7rem' }}>
        <div className="container about-inner">
          <div className="about-copy">
            <div>
              <span className="eyebrow">About Gil's Ventures</span>
              <h1 className="section-title">Built on decades of field experience in El Paso and the Borderland</h1>
            </div>
            <p className="about-body">
              Carlos Gil of Gil&apos;s Ventures began his roofing career in 1981, working for and heading the work crews of his father&apos;s company. Having roofed most of El Paso&apos;s homes built from the early-1980&apos;s on, you will still see the Spanish tile homes, built-up roofs, and shingle homes that Carlos roofed still standing today.
            </p>
            <p className="about-body">
              Twenty-three years ago Carlos decided to venture out on his own, and started his own roofing and sheet metal company. Almost immediately, Gil&apos;s Ventures became a primary roofer of all new and old buildings located at Ft. Bliss Military Installation. For over 20 years Gil&apos;s Ventures has worked on military installations, state, and federal projects, as well as commercial and residential roofing in El Paso. We can provide you with high-quality work ranging from: single-ply membrane (TPO, PVC, etc), built-up roofing, SBS roofing, shingle roofing, roof restorations, roof coatings, metal roofs, clay and concrete tile. We can also craft custom sheet metal products for your project.
            </p>
            <ul className="about-credentials">
              <li className="about-cred">Family-owned and operated</li>
              <li className="about-cred">Fort Bliss roofing experience</li>
              <li className="about-cred">Federal, state, and residential work</li>
              <li className="about-cred">Licensed in New Mexico</li>
              <li className="about-cred">Bonded, insured, and accountable</li>
              <li className="about-cred">Known for durable, long-lasting work</li>
            </ul>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link href="/projects/" className="btn btn-ghost-accent">View projects</Link>
              <Link href="/contact/" className="btn btn-primary">Talk about your project</Link>
            </div>
          </div>
          <div className="about-images">
            <div className="about-img-main">
              <Image src="/images/restoration-2.jpg" alt="Gil's Ventures restoration project" fill style={{ objectFit: 'cover' }} />
            </div>
            <div className="about-img-badge">
              <strong>30+</strong>
              <span>Years of roofing experience</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
