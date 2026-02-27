import {Outlet} from 'react-router-dom';
import {Header} from '@/components/header/header.component';
import {Footer} from '@/components/footer/footer.component';

export function MainLayout() {
  return (
    <>
      <Header />
      <main className="mx-auto my-6 flex w-full max-w-7xl flex-col px-2 md:my-8 md:px-4 lg:my-12 min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
