import {Outlet} from 'react-router-dom';

export function BareLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}
