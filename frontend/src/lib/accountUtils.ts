import { User } from "@/types/chat";

interface StoredAccount {
  token: string;
  user: User;
}

const STORAGE_KEY = 'aura_accounts';
const ACTIVE_TOKEN_KEY = 'token';

// Helper: Notify components to re-render
const notifyAccountsChanged = () => {
  window.dispatchEvent(new Event('accounts-updated'));
};

// 1. Get All Accounts (Safe Mode)
export const getStoredAccounts = (): StoredAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing accounts, resetting storage:", error);
    localStorage.removeItem(STORAGE_KEY); // Reset if corrupt
    return [];
  }
};

// 2. Add or Update Account
export const addStoredAccount = (token: string, user: User) => {
  const accounts = getStoredAccounts();
  
  // Check if account already exists
  const existingIndex = accounts.findIndex(a => a.user._id === user._id);
  
  if (existingIndex >= 0) {
    accounts[existingIndex] = { token, user };
  } else {
    accounts.push({ token, user });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  localStorage.setItem(ACTIVE_TOKEN_KEY, token); 
  
  notifyAccountsChanged();
};

// 3. Switch Account
export const switchAccount = (userId: string) => {
  const accounts = getStoredAccounts();
  const account = accounts.find(a => a.user._id === userId);
  
  if (account) {
    localStorage.setItem(ACTIVE_TOKEN_KEY, account.token);
    window.location.href = '/'; 
  }
};

// 4. Force Logout (Fixes "Logout Not Working")
export const removeAccount = (userId?: string) => {
  if (userId) {
      let accounts = getStoredAccounts();
      accounts = accounts.filter(a => a.user._id !== userId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      notifyAccountsChanged();
  }

  // Always clear active token and redirect
  localStorage.removeItem(ACTIVE_TOKEN_KEY);
  window.location.href = '/';
};