import Link from 'next/link';

export const metadata = {
  title: 'Request a Free Roofing Estimate | Gil\'s Ventures — El Paso',
  description: 'Contact Gil\'s Ventures for a free roofing estimate in El Paso, TX. Residential, commercial, and federal projects. Call (915) 274-3835 or fill out our quick form.',
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contact</span>
          <h1>Request a Free Roofing Estimate in El Paso</h1>
          <p className="section-intro">Whether it&apos;s a home, a commercial building, or a federal project, we&apos;ll review your scope and get back to you fast.</p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid">
          <form className="estimate-form service-card" action="https://formspree.io/f/PLACEHOLDER" method="POST">
            <div className="form-grid">
              <label>Name<input type="text" name="name" required /></label>
              <label>Phone<input type="tel" name="phone" required /></label>
              <label>Email<input type="email" name="email" required /></label>
              <label>Property Address<input type="text" name="address" /></label>
            </div>
            <label>Project Type<select name="projectType" defaultValue=""><option value="" disabled>Select project type</option><option>Residential Roofing</option><option>Commercial Roofing</option><option>Federal Project</option><option>Sheet Metal</option><option>Repair / Restoration</option></select></label>
            <label>Project Details<textarea name="message" required /></label>
            <button type="submit" className="btn btn-primary">Send Estimate Request</button>
          </form>
          <div className="info-grid">
            <article className="contact-card">
              <h3>Contact Details</h3>
              <p><strong>Gilbert:</strong> <a href="tel:+19152743835">(915) 274-3835</a></p>
              <p><strong>Carlos:</strong> <a href="tel:+19158209263">(915) 820-9263</a></p>
              <p><strong>Email:</strong> <a href="mailto:gilbertgil@gmail.com">gilbertgil@gmail.com</a></p>
              <p><strong>Alternate Email:</strong> <a href="mailto:gilsventures03@gmail.com">gilsventures03@gmail.com</a></p>
              <p><strong>Address:</strong> 250 Quinella, Sunland Park, NM 88063</p>
              <p><strong>Hours:</strong> Monday-Friday, 6:00 AM - 3:00 PM</p>
            </article>
            <article className="contact-card">
              <h3>Why Clients Call Us</h3>
              <ul>
                <li>Bonded and insured with general liability and workers&apos; compensation coverage</li>
                <li>Licensed in New Mexico</li>
                <li>40+ years of roofing experience</li>
                <li>Federal and military project experience</li>
                <li>Residential, commercial, and sheet metal capabilities</li>
              </ul>
              <Link href="/projects/" className="btn btn-outline">View Project Gallery</Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
