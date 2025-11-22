'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { LoginModalProvider, useLoginModal } from '@/shared/contexts/LoginModalContext';
import { LoginModal } from '@/shared/components/modals/LoginModal';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, closeLoginModal } = useLoginModal();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
      <LoginModal open={isOpen} onOpenChange={closeLoginModal} />
    </>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoginModalProvider>
      <LayoutContent>{children}</LayoutContent>
    </LoginModalProvider>
  );
}
