import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div className="footer-brand-logo">
              <Image
                src="/images/logo.jpg"
                alt="Gil's Ventures, LLC"
                width={160}
                height={52}
                style={{ width: '160px', height: 'auto' }}
              />
            </div>
            <p className="footer-brand-tagline">
              Commercial and residential roofing, restoration, and sheet metal services
              across El Paso, TX and the Borderland. Family-owned for over 30 years.
            </p>
          </div>

          <div>
            <p className="footer-col-title">Navigation</p>
            <ul className="footer-links">
              <li><Link href="/services/">Services</Link></li>
              <li><Link href="/projects/">Projects Gallery</Link></li>
              <li><Link href="/about/">About</Link></li>
              <li><Link href="/contact/">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="footer-col-title">Contact</p>
            <ul className="footer-links">
              <li>
                <a href="tel:+19152743835">Gilbert: (915) 274-3835</a>
              </li>
              <li>
                <a href="tel:+19158209263">Carlos: (915) 820-9263</a>
              </li>
              <li>
                <a href="mailto:gilbertgil@gmail.com">gilbertgil@gmail.com</a>
              </li>
              <li style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                250 Quinella, Sunland Park, NM
              </li>
              <li style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                Mon–Fri 6am–3pm
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} Gil's Ventures, LLC. All rights reserved.
          </p>
          <p className="footer-license">
            Licensed in New Mexico · Bonded · General Liability + Workers' Compensation Insurance
          </p>
        </div>
      </div>
    </footer>
  );
}
