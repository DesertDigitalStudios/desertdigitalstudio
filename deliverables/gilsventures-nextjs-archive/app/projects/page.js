import Image from 'next/image';
import { galleryItems, featuredProjects } from '../../lib/site-data';

export const metadata = {
  title: 'Projects Gallery',
  description: "Project gallery featuring roofing, restoration, sheet metal, and federal work completed by Gil's Ventures across El Paso and the Borderland.",
};

export default function ProjectsPage() {
  return (
    <main>
      <section className="section project-hero-section" style={{ background: 'var(--off-white)', paddingTop: '6.25rem' }}>
        <div className="container project-hero-grid">
          <div>
            <span className="eyebrow">Projects</span>
            <h1 className="section-title" style={{ maxWidth: '780px' }}>
              Projects that show the range, scale, and quality of the work
            </h1>
            <p className="section-body" style={{ maxWidth: '700px' }}>
              From Fort Bliss and Customs and Border Protection to housing, restoration, and residential roofing, Gil&apos;s Ventures has built a project history that speaks for itself.
            </p>
            <div className="project-hero-pills">
              <span className="project-hero-pill">Fort Bliss IDIQ</span>
              <span className="project-hero-pill">CBP Roofing + HVAC</span>
              <span className="project-hero-pill">Housing Authority Work</span>
            </div>
          </div>

          <div className="project-hero-media">
            <Image src="/images/cbp-standing-seam.jpg" alt="Featured Customs and Border Protection project by Gil's Ventures" fill priority style={{ objectFit: 'cover' }} />
            <div className="project-hero-overlay" />
            <div className="project-hero-callout">
              <span className="project-hero-callout-kicker">Featured project</span>
              <strong>Customs and Border Protection</strong>
              <p>Roof systems, HVAC integration, standing seam metal, TPO, and custom aluminum catwalk work.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section featured-grid-section">
        <div className="container">
          <div className="project-story-stack">
            {featuredProjects.map((project, index) => (
              <article key={project.title} className={`project-story-card ${index % 2 === 1 ? 'reverse' : ''}`}>
                <div className="project-story-media">
                  <Image src={project.image} alt={project.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="project-story-copy">
                  <span className="project-story-kicker">{project.eyebrow}</span>
                  <h2>{project.title}</h2>
                  <p className="project-story-body">{project.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section project-library-section">
        <div className="container">
          <div className="project-library-header">
            <div>
              <span className="eyebrow">Selected gallery work</span>
              <h2 className="section-title">More of the roofing, restoration, and sheet metal work already on the current site</h2>
            </div>
            <p className="section-body">
              A closer look at roofing systems, restoration work, sheet metal details, and public-sector projects completed by Gil&apos;s Ventures.
            </p>
          </div>
          <div className="project-gallery-grid">
            {galleryItems.map((item) => (
              <figure key={item.src} className="project-gallery-card">
                <div className="project-gallery-media">
                  <Image src={item.src} alt={item.alt} fill style={{ objectFit: 'cover' }} />
                </div>
                <figcaption>
                  <span className="project-gallery-kicker">Project Gallery</span>
                  <h3>{item.title}</h3>
                  <p>{item.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
