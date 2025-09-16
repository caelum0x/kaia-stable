import { create } from 'zustand';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: '0',
  provider: null,
  signer: null,
  isLoading: false,

  connectWallet: async () => {
    set({ isLoading: true });
    
    try {
      // Check if MetaMask or wallet is available
      if (!window.ethereum) {
        toast.error('Please install MetaMask or a Web3 wallet');
        return;
      }

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Get signer
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Check if connected to Kaia network
      const network = await provider.getNetwork();
      const kaiaChainId = process.env.NODE_ENV === 'production' ? 8217n : 1001n; // Mainnet : Testnet
      
      if (network.chainId !== kaiaChainId) {
        try {
          // Try to switch to Kaia network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ 
              chainId: `0x${kaiaChainId.toString(16)}` 
            }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${kaiaChainId.toString(16)}`,
                chainName: kaiaChainId === 8217n ? 'Kaia Mainnet' : 'Kaia Testnet',
                nativeCurrency: {
                  name: 'KAIA',
                  symbol: 'KAIA',
                  decimals: 18,
                },
                rpcUrls: [
                  kaiaChainId === 8217n 
                    ? 'https://api.cypress.klaytn.net:8651'
                    : 'https://api.baobab.klaytn.net:8651'
                ],
                blockExplorerUrls: [
                  kaiaChainId === 8217n
                    ? 'https://scope.klaytn.com'
                    : 'https://baobab.scope.klaytn.com'
                ],
              }],
            });
          }
        }
      }

      // Get balance
      const balance = await provider.getBalance(address);
      
      set({
        isConnected: true,
        address,
        balance: ethers.formatEther(balance),
        provider,
        signer,
        isLoading: false,
      });

      toast.success('Wallet connected successfully!');
      
      // Store connection in localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
      set({ isLoading: false });
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      balance: '0',
      provider: null,
      signer: null,
    });
    
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    
    toast.success('Wallet disconnected');
  },

  updateBalance: async () => {
    const { provider, address } = get();
    
    if (!provider || !address) return;
    
    try {
      const balance = await provider.getBalance(address);
      set({ balance: ethers.formatEther(balance) });
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  },
}));

// Auto-connect on page load if previously connected
if (typeof window !== 'undefined') {
  const wasConnected = localStorage.getItem('walletConnected');
  const savedAddress = localStorage.getItem('walletAddress');
  
  if (wasConnected && savedAddress && window.ethereum) {
    // Check if wallet is still connected
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
          useWalletStore.getState().connectWallet();
        }
      })
      .catch(console.error);
  }
}

// Listen for account changes
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      useWalletStore.getState().disconnectWallet();
    } else {
      // Reconnect with new account
      useWalletStore.getState().connectWallet();
    }
  });

  window.ethereum.on('chainChanged', () => {
    // Reload page on network change
    window.location.reload();
  });
}