import {Link} from 'react-router-dom';
import {defaultLocale} from '@/i18n/constants.ts';
import {getLocalePath} from '@/i18n/navigation.ts';

export function NotFound() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to={getLocalePath(defaultLocale)}>Go to Home</Link>
    </div>
  );
}
