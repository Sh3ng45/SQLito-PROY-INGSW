import React, { PropsWithChildren, useState } from 'react';
import ExampleStoreContext from './example_store_context';

const ExampleStoreProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [number, setNumber] = useState(0);

  const addOne = () => {
    setNumber((prev) => prev + 1);
  };

  return (
    <ExampleStoreContext.Provider value={{ number, addOne }}>
      {children}
    </ExampleStoreContext.Provider>
  );
};

export default ExampleStoreProvider;
