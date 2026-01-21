import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

interface UserContextType {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const savedName = sessionStorage.getItem('typing_master_username');
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  const login = (name: string) => {
    sessionStorage.setItem('typing_master_username', name);
    setUsername(name);
  };

  const logout = () => {
    sessionStorage.removeItem('typing_master_username');
    setUsername(null);
  };

  return (
    <UserContext.Provider value={{ username, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
