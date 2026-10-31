// src/context/DatabaseContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  const initDatabase = async () => {
    try {
      // Check if database is initialized
      const initialized = await AsyncStorage.getItem('@database_initialized');
      
      if (!initialized) {
        // First time setup
        await AsyncStorage.setItem('@database_initialized', 'true');
        console.log('Database initialized for first time');
      }
      
      setIsInitialized(true);
      setLoading(false);
      console.log('Database ready');
    } catch (error) {
      console.error('Database initialization error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    initDatabase();
  }, []);

  const value = {
    db,
    setDb,
    isInitialized,
    loading,
    initDatabase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

export default DatabaseContext;