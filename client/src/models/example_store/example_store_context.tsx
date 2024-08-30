import { createContext } from 'react';

const ExampleStoreContext = createContext<ExampleStore | undefined>(undefined);

export default ExampleStoreContext;
