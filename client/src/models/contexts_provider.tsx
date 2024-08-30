import React, { PropsWithChildren } from 'react';

import { ExampleStoreProvider } from './example_store';
import { AuthProvider } from './authContext';

const ContextsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const providers = [ExampleStoreProvider, AuthProvider];

  return providers.reduce((acc, Provider) => {
    return <Provider>{acc}</Provider>;
  }, children);
};

export default ContextsProvider;
