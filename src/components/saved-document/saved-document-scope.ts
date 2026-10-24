import { createContext, useContext } from 'react';

const SavedDocumentContext = createContext(false);
export const SavedDocumentScope = SavedDocumentContext.Provider;
export const useSavedDocumentScope = () => useContext(SavedDocumentContext);
