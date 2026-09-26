import { useState } from 'react';
import { Camera } from 'lucide-react';
import { site } from '../config/site.js';
import { useReveal } from '../hooks/useReveal.js';
import '../styles/about.css';

export default function About() {
  const [ref, visible] = useReveal();
  const [imgFailed, setImgFailed] = useState(false);
  const { about } = site;

  return (
    <section id="about" className="section about" ref={ref}>
      <div className={`container about-grid reveal${visible ? ' is-visible' : ''}`}>
        <div className="about-portrait-wrap">
          <div className="about-portrait">
            {imgFailed ? (
              <div className="about-portrait-fallback">
                <Camera size={44} strokeWidth={1.4} />
              </div>
            ) : (
              <img src={site.profileImage} alt={site.profileAlt} onError={() => setImgFailed(true)} />
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow-label">{about.heading}</p>
          {/* <h2 className="about-heading">{site.name}</h2> */}
          <div className="about-text">
            <p className="about-intro">{about.intro}</p>
            <p>{about.photography}</p>
            {about.videography && <p>{about.videography}</p>}
          </div>
          {about.details?.length > 0 && (
            <div className="about-details">
              {about.details.map((d) => (
                <span className="about-detail-chip" key={d}>
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
