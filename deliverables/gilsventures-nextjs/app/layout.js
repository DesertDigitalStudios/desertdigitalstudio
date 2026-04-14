import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileCTABar from '@/components/MobileCTABar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const siteUrl = 'https://www.gilsventures.com';
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-PLACEHOLDER';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'RoofingContractor',
  '@id': `${siteUrl}/#roofingcontractor`,
  name: "Gil's Ventures, LLC",
  url: siteUrl,
  image: `${siteUrl}/images/hero-aerial.jpg`,
  logo: `${siteUrl}/images/logo-light.png`,
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
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 31.7965,
    longitude: -106.5739,
  },
  areaServed: ['El Paso, TX', 'Sunland Park, NM', 'Fort Bliss, TX', 'Las Cruces, NM', 'Anthony, TX', 'Horizon City, TX', 'Socorro, TX'],
  foundingDate: '2003',
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '06:00',
    closes: '15:00',
  }],
  sameAs: [
    'https://www.instagram.com/gilsventures',
    'https://www.facebook.com/'
  ],
  description: "Gil's Ventures, LLC provides residential, commercial, federal, and sheet metal roofing services across El Paso and the Borderland. Licensed in New Mexico. Bonded and insured.",
  makesOffer: [
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Residential Roofing' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Commercial Roofing' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Federal Roofing Projects' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sheet Metal Fabrication' } },
  ],
};

export const metadata = {
  metadataBase: new URL('https://www.gilsventures.com'),
  title: {
    default: "El Paso Roofing Contractor | Gil's Ventures, LLC",
    template: '%s | Gil\'s Ventures, LLC',
  },
  description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, federal, and sheet metal roofing. Licensed in NM. Call (915) 274-3835.",
  keywords: ['El Paso roofing contractor', 'commercial roofing El Paso', 'residential roofing El Paso', 'sheet metal contractor El Paso', 'Fort Bliss roofing', 'roof repair El Paso', 'roof replacement El Paso'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "El Paso Roofing Contractor | Gil's Ventures, LLC",
    description: "Gil's Ventures is El Paso's trusted roofing contractor with 40+ years of experience in residential, commercial, and federal roofing.",
    url: 'https://www.gilsventures.com',
    siteName: "Gil's Ventures, LLC",
    images: [{ url: '/images/hero-aerial.jpg', width: 1600, height: 900, alt: "Gil's Ventures aerial roofing project" }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "El Paso Roofing Contractor | Gil's Ventures, LLC",
    description: "Commercial, residential, federal, and sheet metal roofing backed by 40+ years of Borderland experience.",
    images: ['/images/hero-aerial.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        {gaMeasurementId !== 'G-PLACEHOLDER' && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-script" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
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
