import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileCTABar from '@/components/MobileCTABar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const schema = {
  '@context': 'https://schema.org',
  '@type': 'RoofingContractor',
  name: "Gil's Ventures, LLC",
  url: 'https://www.gilsventures.com',
  telephone: ['+19152743835', '+19158209263'],
  email: 'gilbertgil@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '250 Quinella',
    addressLocality: 'Sunland Park',
    addressRegion: 'NM',
    postalCode: '88063',
    addressCountry: 'US',
  },
  areaServed: ['El Paso, TX', 'Sunland Park, NM', 'Fort Bliss, TX', 'Las Cruces, NM'],
  foundingDate: '2003',
  description: "Gil's Ventures, LLC provides residential, commercial, and federal roofing services across El Paso and the Borderland. Licensed in New Mexico. Bonded and insured.",
};

export const metadata = {
  metadataBase: new URL('https://www.gilsventures.com'),
  title: {
    default: "El Paso Roofing Contractor | Gil's Ventures, LLC",
    template: '%s | Gil\'s Ventures, LLC',
  },
  description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, and federal roofing. Licensed in NM. Call (915) 274-3835.",
  keywords: ['El Paso roofing contractor', 'commercial roofing El Paso', 'residential roofing El Paso', 'sheet metal contractor El Paso', 'Fort Bliss roofing'],
  openGraph: {
    title: "El Paso Roofing Contractor | Gil's Ventures, LLC",
    description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, and federal roofing.",
    url: 'https://www.gilsventures.com',
    siteName: "Gil's Ventures, LLC",
    images: [{ url: '/images/hero-aerial.jpg', width: 1600, height: 900, alt: "Gil's Ventures aerial roofing project" }],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
        <MobileCTABar />
      </body>
    </html>
  );
}
