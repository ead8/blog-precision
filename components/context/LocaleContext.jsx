"use client"


import React, { createContext, useContext, useState, useEffect } from 'react';

const LocaleContext = createContext();

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState(null);

  useEffect(() => {
    // Load from localStorage or auto-detect from browser
    const savedLocale = localStorage.getItem('userLocale');
    if (savedLocale) {
      setLocale(savedLocale);
    } else if (typeof window !== 'undefined' && window.navigator) {
      const browserLang = window.navigator.language;
      
      // Map browser language codes to supported locales
      const localeMap = {
        // English variants
        'en-NZ': 'en-NZ',
        'en-US': 'en-US',
        'en-GB': 'en-GB',
        'en-AU': 'en-AU',
        'en-CA': 'en-CA',
        'en': 'en-US',
        
        // Spanish variants
        'es-ES': 'es-ES',
        'es-MX': 'es-MX',
        'es': 'es-ES',
        
        // French
        'fr-FR': 'fr-FR',
        'fr': 'fr-FR',
        
        // German
        'de-DE': 'de-DE',
        'de': 'de-DE',
      };
      
      // Try exact match first, then language code without region
      const mappedLocale = localeMap[browserLang] || 
                           localeMap[browserLang.split('-')[0]] || 
                           'en-US'; // Default fallback
      
      setLocale(mappedLocale);
      localStorage.setItem('userLocale', mappedLocale);
    }
  }, []);

  const updateLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('userLocale', newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, updateLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};
