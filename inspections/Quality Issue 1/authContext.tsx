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

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const authURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const [user, setUser] = useState<IUser | null>(null);

  const [token, setToken] = useLocalStorage<string | null>('token', null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    setIsAuthenticated(!!user && !!token);
  }, [user, token]);

  const queryResponse = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!token) return null;

      const response = await axios.get(`${authURL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data: unknown = response.data;

      if (typeof data !== 'object' || data === null) return null;
      if (!('username' in data) || typeof data.username !== 'string') return null;

      const result: IUser = {
        username: data.username,
      };
      return result;
    },
    enabled: !!token,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (!queryResponse.data) {
      setUser(null);
      return;
    }

    setUser({ username: queryResponse.data.username });
  }, [queryResponse.data]);

  const authQuery = useCallback(
    async (path: string, username: string, password: string) => {
      try {
        const response = await axios.post(`${authURL}${path}`, {
          username,
          password,
        });
        if (response.status >= 300 || response.status < 200) {
          switch (response.status) {
            case 401:
              return 'Unauthorized';
            case 403:
              return 'Forbidden';
            case 404:
              return 'Not Found';
            case 500:
              return 'Internal Server Error';
            default:
              return 'Unknown Error';
          }
        }
        const data: unknown = response.data;

        if (typeof data !== 'object' || data === null) return 'Invalid response';

        if (!('token' in data) || !data.token) return 'Invalid token';
        const responseToken = data.token;

        if (typeof responseToken !== 'string') return 'Invalid token type';
        setToken(responseToken);

        return null;
      } catch (error: unknown) {
        if (error instanceof Error) {
          const message = error.message;
          if (message.includes('401')) {
            return 'Unauthorized';
          } else if (message.includes('403')) {
            return 'Forbidden';
          } else if (message.includes('404')) {
            return 'Not Found';
          }
          return message;
        } else if (typeof error === 'string') {
          return error;
        } else {
          return 'Unknown error';
        }
      }
    },
    [setToken, authURL],
  );

  const login = useCallback(
    (username: string, password: string) => {
      return authQuery('/login', username, password);
    },
    [authQuery],
  );

  const register = useCallback(
    (username: string, password: string) => {
      return authQuery('/register', username, password);
    },
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
