import { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import liff from '@line/liff';

import '../styles/globals.css';
import { useWalletStore } from '../store/wallet';
import { useLiffStore } from '../store/liff';
import LoadingScreen from '../components/LoadingScreen';

function MyApp({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { initializeLiff, setLiffReady } = useLiffStore();
  const { connectWallet } = useWalletStore();

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          console.error('LIFF ID not found');
          setIsLoading(false);
          return;
        }

        await liff.init({ liffId });
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          initializeLiff(profile);
          
          if (liff.isInClient()) {
            await connectWallet();
          }
        }
        
        setLiffReady(true);
      } catch (error) {
        console.error('LIFF initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, [initializeLiff, setLiffReady, connectWallet]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Component {...pageProps} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default MyApp;