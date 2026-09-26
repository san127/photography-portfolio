import { site } from '../config/site.js';
import '../styles/contact.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      © {new Date().getFullYear()} {site.name}
    </footer>
  );
}
