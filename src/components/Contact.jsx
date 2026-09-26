import { Mail, Phone, MapPin } from 'lucide-react';
import { site } from '../config/site.js';
import { useReveal } from '../hooks/useReveal.js';
import '../styles/contact.css';

export default function Contact() {
  const [ref, visible] = useReveal();

  return (
    <section id="contact" className="section" ref={ref}>
      <div className={`contact reveal${visible ? ' is-visible' : ''}`}>
        <div className="contact-inner">
          <div className="contact-heading">
            <p className="eyebrow-label">Contact</p>
            <h2>Let's work together</h2>
            {/* <p className="contact-sub">For bookings, prints, or just to talk about light and film.</p> */}
          </div>

          <div className="contact-list">
            <a className="contact-link" href={`mailto:${site.email}`}>
              <span className="icon-wrap">
                <Mail size={17} />
              </span>
              {site.email}
            </a>
            <a className="contact-link" href={`tel:${site.phoneLink}`}>
              <span className="icon-wrap">
                <Phone size={17} />
              </span>
              {site.phone}
            </a>
            <span className="contact-link" style={{ cursor: 'default' }}>
              <span className="icon-wrap">
                <MapPin size={17} />
              </span>
              {site.location}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
