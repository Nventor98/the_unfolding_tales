import { useEffect, useMemo, useState } from 'react';
import type { DatasetStats, SiteRecord } from '../lib/types';

// The Space Data Atlas challenge page recommends NASA Image Library, LROC and HiRISE
// imagery. These five stories use archival NASA image references already attached to
// the matching site records, so the Details action always uses that record's coordinates.
const CINEMATIC_SITE_IDS = [
  'moon-surveyor-3',
  'moon-apollo-11-lrrr',
  'mars-opportunity',
  'moon-apollo-16',
  'moon-apollo-17',
];

export function IntroOverlay({
  open,
  stats,
  sites,
  onEnter,
  onAbout,
  onDetails,
}: {
  open: boolean;
  stats: DatasetStats | null;
  sites: SiteRecord[];
  onEnter: () => void;
  onAbout: () => void;
  onDetails: (site: SiteRecord) => void;
}) {
  const slides = useMemo(() => {
    const byId = new Map(sites.map((site) => [site.id, site]));
    return CINEMATIC_SITE_IDS.map((id) => byId.get(id)).filter(
      (site): site is SiteRecord => Boolean(site?.images?.[0]),
    );
  }, [sites]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeSite = slides[activeIndex];

  useEffect(() => {
    if (!open || paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [open, paused, slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  if (!open) return null;
  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="intro-card intro-card--cinematic">
        <div className="intro-cinematic-grid">
          <section className="intro-copy">
            <span className="intro-eyebrow">An interactive archive of human exploration</span>
            <h1>
              Abandoned
              <span> but not forgotten</span>
            </h1>
            <p className="intro-lede">
              Every machine we sent to another world had a place it ended up. Explore the coordinates—and the
              archival images—that help tell each story.
            </p>
            <div className="intro-actions intro-actions--cinematic">
              <button type="button" className="primary-button" onClick={onEnter}>
                Explore the Globe
              </button>
              <button type="button" className="ghost-button" onClick={onAbout}>
                How the data works
              </button>
            </div>
          </section>

          {activeSite?.images?.[0] && (
            <CinematicSlide
              key={activeSite.id}
              site={activeSite}
              index={activeIndex}
              total={slides.length}
              paused={paused}
              onPauseToggle={() => setPaused((value) => !value)}
              onPrevious={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
              onNext={() => setActiveIndex((current) => (current + 1) % slides.length)}
              onChoose={(index) => setActiveIndex(index)}
              onDetails={() => onDetails(activeSite)}
            />
          )}
        </div>
        <p className="intro-foot intro-foot--cinematic">
          {stats?.total ?? '—'} documented sites · {stats?.uniqueSources ?? '—'} source pages · positions are
          sourced; uncertain locations are labelled, never guessed
        </p>
      </div>
    </div>
  );
}

function CinematicSlide({
  site,
  index,
  total,
  paused,
  onPauseToggle,
  onPrevious,
  onNext,
  onChoose,
  onDetails,
}: {
  site: SiteRecord;
  index: number;
  total: number;
  paused: boolean;
  onPauseToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onChoose: (index: number) => void;
  onDetails: () => void;
}) {
  const image = site.images![0];
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section className="cinematic-story" aria-label={`Featured story ${index + 1} of ${total}`}>
      <div className={`cinematic-image${imageFailed ? ' is-unavailable' : ''}`}>
        {!imageFailed && (
          <img
            src={image.url}
            alt={image.title}
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        )}
        {imageFailed && (
          <div className="cinematic-image-fallback">
            <span>Archival image unavailable</span>
            <a href={image.sourceUrl ?? image.url} target="_blank" rel="noreferrer">Open image source ↗</a>
          </div>
        )}
        <div className="cinematic-image-shade" aria-hidden="true" />
        <div className="cinematic-overline">
          <span>{site.body.toUpperCase()}</span>
          <span>STORY {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        </div>
        <div className="cinematic-caption">
          <span className="cinematic-mission">{site.mission}</span>
          <h2>{image.title}</h2>
          <p>{image.caption || site.summary}</p>
          <span className="cinematic-credit">
            {image.credit}
            {image.sourceUrl && <><span aria-hidden="true"> · </span><a href={image.sourceUrl} target="_blank" rel="noreferrer">Image source ↗</a></>}
          </span>
        </div>
      </div>
      <div className="cinematic-controls">
        <div className="cinematic-pagination" aria-label="Choose a featured story">
          {Array.from({ length: total }, (_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              className={`cinematic-dot${dotIndex === index ? ' is-active' : ''}`}
              aria-label={`Show story ${dotIndex + 1}`}
              aria-current={dotIndex === index ? 'true' : undefined}
              onClick={() => onChoose(dotIndex)}
            />
          ))}
        </div>
        <div className="cinematic-control-actions">
          <button type="button" className="cinematic-control-button" onClick={onPrevious} aria-label="Previous story">←</button>
          <button type="button" className="cinematic-control-button" onClick={onPauseToggle} aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}>
            {paused ? 'Play' : 'Pause'}
          </button>
          <button type="button" className="cinematic-control-button" onClick={onNext} aria-label="Next story">→</button>
          <button type="button" className="cinematic-details-button" onClick={onDetails}>Details <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      <div className="cinematic-site-label">{site.name}</div>
    </section>
  );
}

export function AboutModal({
  open,
  onClose,
  stats,
  version,
  builtAt,
}: {
  open: boolean;
  onClose: () => void;
  stats: DatasetStats | null;
  version: string;
  builtAt: string;
}) {
  if (!open) return null;
  return (
    <div className="overlay about-overlay" role="dialog" aria-modal="true" aria-label="About the data">
      <div className="about-modal">
        <button type="button" className="icon-button about-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <span className="section-label">About the archive</span>
        <h2>Where every marker comes from</h2>
        <p>
          This archive is built from published NASA records and a small number of institutional or peer-reviewed
          sources. Nothing on the globe is illustrative: each record has a named source, a coordinate reference
          frame, and an accuracy statement.
        </p>

        <h3>Data pipeline</h3>
        <p>
          Records live as JSON files in <code>data/curated</code>, one file per theme. NASA source tables are stored
          as machine-readable snapshots in <code>data/ingested</code> and referenced by each record's{' '}
          <code>verification</code> field. A build step validates the schema, cross-checks every verifiable
          coordinate against its snapshot (failing the build on a mismatch) and writes{' '}
          <code>public/data/sites.json</code>, which is the only thing the interface reads. Adding a new site means
          adding a record — no front-end changes.
        </p>
        <div className="about-stats">
          <span>
            <strong>{stats?.total ?? 0}</strong> records
          </span>
          <span>
            <strong>{stats?.withVerification ?? 0}</strong> coordinate-verified
          </span>
          <span>
            <strong>{stats?.withImages ?? 0}</strong> with archival imagery
          </span>
          <span>
            <strong>{stats?.uniqueSources ?? 0}</strong> source pages
          </span>
        </div>

        <h3>Primary sources</h3>
        <ul className="about-links">
          <li>
            <a href="https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html" target="_blank" rel="noreferrer">
              NSSDCA — Apollo Landing Site Coordinates
            </a>
          </li>
          <li>
            <a
              href="https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html"
              target="_blank"
              rel="noreferrer"
            >
              NSSDCA — Table of Anthropogenic Impacts and Spacecraft on the Moon
            </a>
          </li>
          <li>
            <a href="https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_impact.html" target="_blank" rel="noreferrer">
              NSSDCA — Impact sites of Apollo LM and S-IVB stages
            </a>
          </li>
          <li>
            <a href="https://nssdc.gsfc.nasa.gov/planetary/pvprobes.html" target="_blank" rel="noreferrer">
              NSSDCA — Pioneer Venus probe entry and impact data
            </a>
          </li>
          <li>
            <a href="https://www.giss.nasa.gov/tools/mars24/help/landers.html" target="_blank" rel="noreferrer">
              NASA GISS — Mars24 lander catalogue
            </a>
          </li>
          <li>
            <a href="https://lroc.im-ldi.com/" target="_blank" rel="noreferrer">
              LROC — Lunar Reconnaissance Orbiter Camera
            </a>
          </li>
          <li>
            <a href="https://images.nasa.gov/" target="_blank" rel="noreferrer">
              NASA Image and Video Library
            </a>
          </li>
        </ul>

        <h3>Accuracy and honesty</h3>
        <p>
          Each record states whether its position is surveyed, mapped, approximate or uncertain, and some sites
          have no confirmed position at all — those notes are displayed rather than hidden. Where a mission's
          landing point is published only as a region (for example Luna 9 and Luna 2), the marker shows the
          region centre and the story explains that the exact spot is unknown.
        </p>

        <h3>Imagery and audio</h3>
        <p>
          Historical photographs are requested from NASA's image library at runtime and credited to the originating
          center. Planetary textures are derived from NASA imagery via Solar System Scope texture sets (CC BY 4.0),
          processed for use on a sphere. Narration is produced by the browser's speech synthesiser reading the
          sourced text; no audio is pre-recorded, invented, or dramatised.
        </p>

        <h3>Built with</h3>
        <p>
          React, TypeScript and three.js. Dataset version {version} · built {new Date(builtAt).toLocaleString()}.
          Created for the NASA Space Apps Challenge theme “Abandoned but Not Forgotten”.
        </p>

        <div className="about-foot">
          <button type="button" className="primary-button" onClick={onClose}>
            Back to the globe
          </button>
        </div>
      </div>
    </div>
  );
}
