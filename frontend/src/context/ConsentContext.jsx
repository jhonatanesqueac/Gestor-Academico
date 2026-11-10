import { useCallback, useEffect, useMemo, useState } from "react";
import { ConsentContext } from "./consentStore";

const KEY = "sf_consent";

// Sube este número cuando cambies las categorías o la política.
const VERSION = 1;

const DEFAULTS = {
  necessary: true,
  preferences: false,
  analytics: false,
};

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));

    if (raw && raw.version === VERSION) {
      return raw;
    }
  } catch {
    // localStorage no disponible o dato corrupto.
  }

  return null;
}


export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(read);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const save = useCallback((choices) => {
    const next = {
      ...DEFAULTS,
      ...choices,
      necessary: true,
      version: VERSION,
      date: new Date().toISOString(),
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Ignorar si localStorage no está disponible.
    }

    setConsent(next);
    setPrefsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      decided: consent !== null,
      allowed: (cat) => Boolean(consent?.[cat]),
      acceptAll: () =>
        save({ preferences: true, analytics: true }),
      rejectOptional: () => save({}),
      save,
      prefsOpen,
      openPrefs: () => setPrefsOpen(true),
      closePrefs: () => setPrefsOpen(false),
    }),
    [consent, prefsOpen, save]
  );

  useEffect(() => {
    if (value.allowed("analytics")) {
      // initAnalytics();
    }
  }, [value.consent]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}
