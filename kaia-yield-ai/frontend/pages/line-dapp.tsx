// =======================================================
// KAIA YIELD AI - LINE MINI DAPP PAGE
// Next.js page for LINE Mini dApp integration
// =======================================================

import React, { useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Script from 'next/script';

// Dynamically import the LINE Mini dApp component to prevent SSR issues
const LINEMiniDApp = dynamic(() => import('../components/LINEMiniDApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
        <div className="text-xl font-bold mb-2">🤖 Loading KAIA YIELD AI</div>
        <div className="text-sm opacity-80">Initializing LINE Mini dApp...</div>
      </div>
    </div>
  )
});

const LineDAppPage: React.FC = () => {
  useEffect(() => {
    // Prevent zoom on mobile devices
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }

    // Add mobile-specific classes
    document.body.classList.add('line-dapp', 'mobile-optimized');

    // Cleanup
    return () => {
      document.body.classList.remove('line-dapp', 'mobile-optimized');
    };
  }, []);

  return (
    <>
      <Head>
        <title>KAIA YIELD AI - LINE Mini dApp</title>
        <meta name="description" content="AI-Powered USDT Yield Farming with Gamified Rewards on Kaia Network" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10B981" />

        {/* LINE Mini dApp specific meta tags */}
        <meta property="og:title" content="KAIA YIELD AI - Gamified USDT Yield Farming" />
        <meta property="og:description" content="Earn amazing returns with AI-powered yield optimization on Kaia Network" />
        <meta property="og:image" content="/images/og-line-dapp.png" />
        <meta property="og:type" content="website" />

        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KAIA YIELD AI" />

        {/* Prevent caching for real-time data */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://static.line-scdn.net" />
        <link rel="preconnect" href="https://access.line.me" />
        <link rel="dns-prefetch" href="//static.line-scdn.net" />
        <link rel="dns-prefetch" href="//access.line.me" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* Manifest for PWA features */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* Load LIFF SDK */}
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('LIFF SDK loaded successfully');
        }}
        onError={(e) => {
          console.error('Failed to load LIFF SDK:', e);
        }}
      />

      {/* Load LIFF helper functions */}
      <Script
        src="/liff-starter.js"
        strategy="afterInteractive"
      />

      {/* Custom styles for LINE Mini dApp */}
      <style jsx global>{`
        .line-dapp {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-optimized {
          /* Prevent text size adjustment on orientation change */
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;

          /* Prevent horizontal scroll */
          max-width: 100vw;

          /* Smooth scrolling */
          scroll-behavior: smooth;
        }

        /* Hide scrollbar for mobile */
        .line-dapp::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }

        /* Optimize touch targets */
        .line-dapp button,
        .line-dapp a,
        .line-dapp [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Prevent zoom on input focus */
        .line-dapp input,
        .line-dapp textarea,
        .line-dapp select {
          font-size: 16px !important;
        }

        /* Loading spinner animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Custom animations for mobile */
        .mobile-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Optimize for notched devices */
        @supports (padding: max(0px)) {
          .line-dapp {
            padding-left: max(12px, env(safe-area-inset-left));
            padding-right: max(12px, env(safe-area-inset-right));
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }

        /* Dark mode optimizations for LINE */
        @media (prefers-color-scheme: dark) {
          .line-dapp {
            color-scheme: dark;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .line-dapp {
            filter: contrast(1.2);
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .line-dapp * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Render the LINE Mini dApp */}
      <LINEMiniDApp />

      {/* Service Worker Registration for PWA features */}
      <Script id="sw-registration" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                  console.log('SW registered: ', registration);
                })
                .catch(function(registrationError) {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
        `}
      </Script>

      {/* Analytics and performance monitoring */}
      <Script id="analytics" strategy="afterInteractive">
        {`
          // Custom analytics for LINE Mini dApp
          (function() {
            const startTime = Date.now();

            window.addEventListener('load', function() {
              const loadTime = Date.now() - startTime;
              console.log('LINE Mini dApp load time:', loadTime + 'ms');

              // Report to analytics service
              if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                  custom_map: { 'metric1': 'load_time' },
                  'metric1': loadTime
                });
              }
            });

            // Track user interactions
            document.addEventListener('click', function(e) {
              const target = e.target.closest('button, a, [role="button"]');
              if (target) {
                console.log('User interaction:', target.textContent || target.getAttribute('aria-label'));
              }
            });

            // Track errors
            window.addEventListener('error', function(e) {
              console.error('JavaScript error in LINE Mini dApp:', e.error);
            });

            // Track unhandled promise rejections
            window.addEventListener('unhandledrejection', function(e) {
              console.error('Unhandled promise rejection in LINE Mini dApp:', e.reason);
            });
          })();
        `}
      </Script>
    </>
  );
};

export default LineDAppPage;