import Link from 'next/link';

export default function MobileCTABar() {
  return (
    <div className="mobile-cta-bar">
      <a href="tel:+19152743835" className="btn btn-primary">📞 Call Now</a>
      <Link href="/contact/" className="btn btn-primary">Get Free Estimate</Link>
    </div>
  );
}
