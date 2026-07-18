import { Link } from 'react-router-dom';
import { BrandMark } from '../components/Common/BrandMark';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cellar-radial px-6 text-center">
      <BrandMark size="md" tagline="Lost in the vault" />
      <p className="mt-4 max-w-md text-sm text-parchment-200/70">
        That path doesn’t exist. Head back to your dashboard or sign in again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/dashboard" className="btn-primary">
          Dashboard
        </Link>
        <Link to="/login" className="btn-secondary">
          Sign in
        </Link>
      </div>
    </div>
  );
}
