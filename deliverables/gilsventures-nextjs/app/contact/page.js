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
          <p className="section-intro">Tell us what kind of property you have, what needs attention, and the best way to reach you. Gil&apos;s Ventures handles residential, commercial, federal, repair, and sheet metal scopes across the Borderland.</p>
          <div className="contact-hero-actions">
            <a href="tel:+19152743835" className="btn btn-primary">Call Gilbert</a>
            <a href="mailto:gilbertgil@gmail.com" className="btn btn-outline">Email Project Details</a>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container contact-grid">
          <form className="estimate-form service-card" action="https://formspree.io/f/PLACEHOLDER" method="POST">
            <div className="form-intro-box">
              <strong>Free estimate request</strong>
              <span>Share the project basics below. Once the real form endpoint is connected, this will become the main intake path.</span>
            </div>
            <div className="form-grid">
              <label>Name<input type="text" name="name" required /></label>
              <label>Phone<input type="tel" name="phone" required /></label>
              <label>Email<input type="email" name="email" required /></label>
              <label>Property Address<input type="text" name="address" /></label>
            </div>
            <div className="form-grid">
              <label>City / Area<input type="text" name="city" placeholder="El Paso, Sunland Park, Las Cruces, etc." /></label>
              <label>Best Time to Reach You<input type="text" name="bestTime" placeholder="Morning, afternoon, anytime" /></label>
            </div>
            <label>Project Type<select name="projectType" defaultValue=""><option value="" disabled>Select project type</option><option>Residential Roofing</option><option>Commercial Roofing</option><option>Federal Project</option><option>Sheet Metal</option><option>Repair / Restoration</option></select></label>
            <label>Project Details<textarea name="message" required placeholder="Tell us what kind of roof or scope you have, what problem you&apos;re dealing with, and any timing details that matter." /></label>
            <div className="form-reassurance">
              <span>Prefer to talk first? Call <a href="tel:+19152743835">(915) 274-3835</a>.</span>
              <span>Projects are reviewed for homes, commercial buildings, and more complex scopes.</span>
            </div>
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
            <article className="contact-card contact-card-accent">
              <h3>What happens next</h3>
              <ul>
                <li>You send the project details or call directly</li>
                <li>Gil&apos;s Ventures reviews the scope and property type</li>
                <li>You get the next step for pricing, inspection, or estimate follow-up</li>
              </ul>
              <p className="contact-note">For faster follow-up on active roofing issues, calling is usually the quickest path.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
