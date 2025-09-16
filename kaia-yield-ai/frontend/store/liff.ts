import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffOS {
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
}

interface LiffContext {
  type: 'utou' | 'room' | 'group' | 'square_chat';
  userId?: string;
  roomId?: string;
  groupId?: string;
  squareChatId?: string;
}

interface ShareTargetPicker {
  isMultipleSelect: boolean;
}

interface LiffState {
  // LIFF Status
  isInClient: boolean;
  isReady: boolean;
  isLoggedIn: boolean;
  isInitialized: boolean;

  // User Profile
  profile: LiffProfile | null;

  // Device/Platform Info
  os: LiffOS | null;
  language: string;
  version: string;
  lineVersion: string;

  // Context
  context: LiffContext | null;

  // Features Support
  features: {
    shareTargetPicker: boolean;
    bluetoothLeFunction: boolean;
    subwindow: boolean;
  };

  // Loading & Error States
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeLiff: (liffId: string) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<LiffProfile | null>;
  shareTargetPicker: (messages: any[]) => Promise<void>;
  openWindow: (url: string, external?: boolean) => void;
  closeWindow: () => void;
  sendMessages: (messages: any[]) => Promise<void>;
  scanCode: () => Promise<string>;

  // Bluetooth LE (if supported)
  requestDevice: () => Promise<any>;

  // Share functions
  shareToTimeline: (message: any) => Promise<void>;
  shareToFriend: (message: any) => Promise<void>;

  // Utility
  isFeatureSupported: (feature: string) => boolean;
  clearError: () => void;
}

declare global {
  interface Window {
    liff: any;
  }
}

export const useLiffStore = create<LiffState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isInClient: false,
      isReady: false,
      isLoggedIn: false,
      isInitialized: false,

      profile: null,
      os: null,
      language: 'en',
      version: '',
      lineVersion: '',

      context: null,

      features: {
        shareTargetPicker: false,
        bluetoothLeFunction: false,
        subwindow: false
      },

      isLoading: false,
      error: null,

      // Actions
      initializeLiff: async (liffId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Check if LIFF is available
          if (typeof window === 'undefined' || !window.liff) {
            throw new Error('LIFF SDK not loaded');
          }

          // Initialize LIFF
          await window.liff.init({ liffId });

          const isInClient = window.liff.isInClient();
          const isLoggedIn = window.liff.isLoggedIn();

          // Get device/platform info
          const os = {
            isAndroid: window.liff.getOS() === 'android',
            isIOS: window.liff.getOS() === 'ios',
            isWeb: window.liff.getOS() === 'web'
          };

          const language = window.liff.getLanguage();
          const version = window.liff.getVersion();
          const lineVersion = window.liff.getLineVersion();

          // Get context if in client
          let context = null;
          if (isInClient) {
            context = window.liff.getContext();
          }

          // Check feature support
          const features = {
            shareTargetPicker: window.liff.isApiAvailable('shareTargetPicker'),
            bluetoothLeFunction: window.liff.isApiAvailable('bluetoothLeFunction'),
            subwindow: window.liff.isApiAvailable('subwindow')
          };

          set({
            isInClient,
            isLoggedIn,
            isInitialized: true,
            isReady: true,
            os,
            language,
            version,
            lineVersion,
            context,
            features,
            isLoading: false,
            error: null
          });

          // Get profile if logged in
          if (isLoggedIn) {
            await get().getProfile();
          }

        } catch (error) {
          console.error('LIFF initialization failed:', error);
          set({
            error: error instanceof Error ? error.message : 'LIFF initialization failed',
            isLoading: false,
            isReady: false
          });
        }
      },

      login: async () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          if (!window.liff.isLoggedIn()) {
            window.liff.login();
          }
        } catch (error) {
          console.error('LIFF login failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Login failed'
          });
        }
      },

      logout: async () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          window.liff.logout();

          set({
            isLoggedIn: false,
            profile: null
          });
        } catch (error) {
          console.error('LIFF logout failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Logout failed'
          });
        }
      },

      getProfile: async () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          if (!window.liff.isLoggedIn()) {
            throw new Error('User not logged in');
          }

          const profile = await window.liff.getProfile();

          set({
            profile: {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage
            },
            isLoggedIn: true
          });

          return profile;
        } catch (error) {
          console.error('Failed to get profile:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to get profile'
          });
          return null;
        }
      },

      shareTargetPicker: async (messages: any[]) => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          if (!get().features.shareTargetPicker) {
            throw new Error('Share target picker not supported');
          }

          const result = await window.liff.shareTargetPicker(messages);
          return result;
        } catch (error) {
          console.error('Share target picker failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Share failed'
          });
        }
      },

      openWindow: (url: string, external = false) => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          window.liff.openWindow({
            url,
            external
          });
        } catch (error) {
          console.error('Open window failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to open window'
          });
        }
      },

      closeWindow: () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          window.liff.closeWindow();
        } catch (error) {
          console.error('Close window failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to close window'
          });
        }
      },

      sendMessages: async (messages: any[]) => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          await window.liff.sendMessages(messages);
        } catch (error) {
          console.error('Send messages failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to send messages'
          });
        }
      },

      scanCode: async () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          const result = await window.liff.scanCode();
          return result.value;
        } catch (error) {
          console.error('Scan code failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to scan code'
          });
          throw error;
        }
      },

      requestDevice: async () => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          if (!get().features.bluetoothLeFunction) {
            throw new Error('Bluetooth LE not supported');
          }

          const device = await window.liff.bluetooth.requestDevice();
          return device;
        } catch (error) {
          console.error('Bluetooth request failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Bluetooth request failed'
          });
          throw error;
        }
      },

      shareToTimeline: async (message: any) => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          // Note: This feature might not be available in all regions
          await window.liff.shareToTimeline(message);
        } catch (error) {
          console.error('Share to timeline failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to share to timeline'
          });
        }
      },

      shareToFriend: async (message: any) => {
        try {
          if (!window.liff) {
            throw new Error('LIFF not initialized');
          }

          await window.liff.shareToFriend(message);
        } catch (error) {
          console.error('Share to friend failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to share to friend'
          });
        }
      },

      isFeatureSupported: (feature: string) => {
        if (!window.liff) return false;
        return window.liff.isApiAvailable(feature);
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'liff-store'
    }
  )
);

// Helper hook for common LIFF operations
export const useLiffHelpers = () => {
  const {
    isInClient,
    isReady,
    isLoggedIn,
    profile,
    shareTargetPicker,
    sendMessages,
    openWindow
  } = useLiffStore();

  const shareStrategy = async (strategy: any, message?: string) => {
    const shareMessage = {
      type: 'flex',
      altText: `Check out this yield strategy: ${strategy.name}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'KAIA YIELD AI',
              weight: 'bold',
              color: '#1DB954',
              size: 'sm'
            },
            {
              type: 'text',
              text: 'Strategy Recommendation',
              weight: 'bold',
              size: 'lg'
            }
          ]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: strategy.name,
              weight: 'bold',
              size: 'xl',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'APY',
                      size: 'sm',
                      color: '#666666',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: `${(strategy.apy / 100).toFixed(2)}%`,
                      weight: 'bold',
                      size: 'lg',
                      color: '#1DB954',
                      flex: 2
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'text',
                      text: 'Risk Level',
                      size: 'sm',
                      color: '#666666',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: strategy.riskLevel <= 3 ? 'Low' : strategy.riskLevel <= 6 ? 'Medium' : 'High',
                      size: 'sm',
                      flex: 2
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            message ? {
              type: 'text',
              text: message,
              size: 'sm',
              color: '#666666',
              wrap: true,
              margin: 'md'
            } : null,
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: 'Check it out',
                uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}?strategy=${strategy.id}&ref=share`
              }
            }
          ].filter(Boolean)
        }
      }
    };

    try {
      await shareTargetPicker([shareMessage]);
    } catch (error) {
      // Fallback to send messages if share target picker fails
      await sendMessages([shareMessage]);
    }
  };

  const sharePortfolio = async (portfolioData: any) => {
    const shareMessage = {
      type: 'text',
      text: `🚀 My KAIA YIELD AI Portfolio\n\n💰 Total Value: $${portfolioData.totalValue}\n📈 Total Returns: $${portfolioData.totalReturns}\n🎯 ROI: ${portfolioData.roi}%\n\nJoin me on KAIA YIELD AI and start earning yield on your crypto!`
    };

    try {
      await shareTargetPicker([shareMessage]);
    } catch (error) {
      await sendMessages([shareMessage]);
    }
  };

  const openExternalLink = (url: string) => {
    if (isInClient) {
      openWindow(url, true);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    isInClient,
    isReady,
    isLoggedIn,
    profile,
    shareStrategy,
    sharePortfolio,
    openExternalLink,
    canShare: isInClient && isLoggedIn
  };
};

// Initialize LIFF when the store is created (if in browser)
if (typeof window !== 'undefined') {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  if (liffId) {
    // Load LIFF SDK
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.onload = () => {
      useLiffStore.getState().initializeLiff(liffId);
    };
    document.head.appendChild(script);
  }
}