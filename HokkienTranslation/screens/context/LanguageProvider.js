import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [languages, setLanguages] = useState(['Hokkien', 'English']);

  const toggleLanguages = () => {
    setLanguages(([lang1, lang2]) => [lang2, lang1]);
  };

  return (
    <LanguageContext.Provider value={{ languages, setLanguages, toggleLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
