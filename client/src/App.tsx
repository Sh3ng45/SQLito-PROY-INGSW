import ContextsProvider from './models/contexts_provider';
import RouterBuilder from './controllers/routes_builder';
import { QueryClientProvider } from '@tanstack/react-query';

import queryClient from './query_client';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ContextsProvider>
        <RouterBuilder />
      </ContextsProvider>
    </QueryClientProvider>
  );
};

export default App;
