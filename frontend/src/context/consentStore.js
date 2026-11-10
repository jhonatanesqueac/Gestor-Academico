import { createContext, useContext } from "react";

export const ConsentContext = createContext(null);

export const useConsent = () => useContext(ConsentContext);