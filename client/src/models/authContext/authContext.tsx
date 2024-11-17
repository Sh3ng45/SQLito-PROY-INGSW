import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import useLocalStorage from '../../hooks/useLocalStorage';
import axios from 'axios';

export interface IUser {
  username: string;
}

export interface IAuthContext {
  token: string | null;
  user: IUser | null;
  loadingUser: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('AuthContext must be used within a AuthProvider');
  }

  return context;
};

const validateUserResponse = (data: unknown): IUser | null => {
  if (typeof data !== 'object' || data === null) return null;
  if (!('username' in data) || typeof data.username !== 'string') return null;

  return { username: data.username };
};

const handleError = (status: number | null, message?: string): string | null => {
  if (!status) return message || 'Unknown error';
  const errors: Record<number, string> = {
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };
  return errors[status] || 'Unknown Error';
};

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const authURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useLocalStorage<string | null>('token', null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    setIsAuthenticated(!!user && !!token);
  }, [user, token]);

  const fetchUser = async () => {
    if (!token) return null;
    try {
      const response = await axios.get(`${authURL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return validateUserResponse(response.data);
    } catch {
      return null;
    }
  };

  const queryResponse = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: !!token,
    refetchInterval: 1000,
  });

  useEffect(() => {
    setUser(queryResponse.data || null);
  }, [queryResponse.data]);

  const authQuery = useCallback(
    async (path: string, username: string, password: string) => {
      try {
        const response = await axios.post(`${authURL}${path}`, { username, password });
        const { status, data } = response;

        if (status < 200 || status >= 300) {
          return handleError(status);
        }

        if (!data || typeof data !== 'object' || !('token' in data)) {
          return 'Invalid response';
        }

        const responseToken = data.token;
        if (typeof responseToken !== 'string') return 'Invalid token type';

        setToken(responseToken);
        return null;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return handleError(null, message);
      }
    },
    [authURL, setToken],
  );

  const login = useCallback(
    (username: string, password: string) => authQuery('/login', username, password),
    [authQuery],
  );

  const register = useCallback(
    (username: string, password: string) => authQuery('/register', username, password),
    [authQuery],
  );

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const exposedValues: IAuthContext = {
    token,
    user,
    loadingUser: queryResponse.isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={exposedValues}>{children}</AuthContext.Provider>;
};
