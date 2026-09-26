import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="state-block" style={{ padding: '6rem 1rem' }}>
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
        Back to the portfolio
      </Link>
    </div>
  );
}
