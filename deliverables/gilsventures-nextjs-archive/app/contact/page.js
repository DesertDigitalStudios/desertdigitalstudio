import Link from 'next/link';

export const metadata = {
  title: 'Contact',
  description: "Contact Gil's Ventures for commercial roofing, residential roofing, federal projects, restoration work, and sheet metal services in El Paso and the Borderland.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="section contact-section" style={{ paddingTop: '7rem' }}>
        <div className="container contact-inner">
          <div className="contact-cta">
            <div>
              <span className="eyebrow eyebrow-light">Contact us</span>
              <h1 className="section-title light">Let's talk about the scope</h1>
              <p className="section-body light">
                Need a new roof system, restoration work, sheet metal fabrication, or help with a larger commercial or federal project? Reach out directly and Gil's Ventures can review it with you.
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
              <a href="mailto:gilbertgil@gmail.com" className="btn btn-primary">Email Gilbert</a>
              <a href="tel:+19152743835" className="btn btn-outline-light">Call now</a>
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
            <div className="contact-detail-item">
              <p className="contact-detail-label">Need examples?</p>
              <p className="contact-detail-value"><Link href="/projects/" style={{ color: 'var(--accent-mid)' }}>View recent project photos →</Link></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
