import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  metadataBase: new URL('https://www.gilsventures.com'),
  title: {
    default: "Gil's Ventures, LLC | Commercial & Residential Roofing in El Paso",
    template: "%s | Gil's Ventures, LLC",
  },
  description:
    "Gil's Ventures provides commercial and residential roofing, roof restoration, metal roofing, tile systems, sheet metal fabrication, and federal contracting work across El Paso, TX and the Borderland.",
  keywords: [
    'roofing El Paso',
    'commercial roofing El Paso',
    'residential roofing El Paso',
    'metal roofing El Paso',
    'roof restoration El Paso',
    'Fort Bliss roofing contractor',
    'TPO roofing El Paso',
    'sheet metal El Paso',
    'roofing contractor borderland',
  ],
  openGraph: {
    siteName: "Gil's Ventures, LLC",
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
