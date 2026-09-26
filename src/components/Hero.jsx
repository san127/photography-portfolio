import { site } from '../config/site.js';
import '../styles/hero.css';

export default function Hero() {
  return (
    <div id="top" className="hero">
      <div className="container">
        <p className="hero-eyebrow">{site.location}</p>
        <h1>{site.name}</h1>
        {/* <p>Photographs of light, sky and everyday moments — mostly taken slowly, mostly outdoors.</p> */}
        <div className="hero-rule" />
      </div>
    </div>
  );
}
