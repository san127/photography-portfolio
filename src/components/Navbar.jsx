import { useEffect, useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { site } from '../config/site.js';
import { useScrollSpy } from '../hooks/useScrollSpy.js';
import '../styles/navbar.css';

const LINKS = [
  { id: 'about', label: 'About' },
  { id: 'photography', label: 'Photography' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useScrollSpy(LINKS.map((l) => l.id));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={`navbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <a href="#top" className="navbar-brand" onClick={go('top')}>
          {site.name}
          <span>{site.tagline}</span>
        </a>

        <nav aria-label="Primary">
          <ul className="navbar-links">
            {LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={active === link.id ? 'is-active' : ''}
                  onClick={go(link.id)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar-actions">
          <a href="/admin" className="icon-btn" aria-label="Admin login" title="Admin">
            <ShieldCheck size={17} />
          </a>
          <button
            type="button"
            className="navbar-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <div className={`navbar-mobile-panel${open ? ' is-open' : ''}`}>
        <ul>
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={active === link.id ? 'is-active' : ''}
                onClick={go(link.id)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
