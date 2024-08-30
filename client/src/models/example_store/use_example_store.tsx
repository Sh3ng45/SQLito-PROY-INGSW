import { useContext } from 'react';
import ExampleStoreContext from './example_store_context';

export const useExampleStore = () => {
  const context = useContext(ExampleStoreContext);

  if (!context) {
    throw new Error('useExampleContext must be used within a ExampleStoreProvider');
  }

  return context;
};
