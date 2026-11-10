import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useConsent } from "../context/consentStore";
import { pop } from "../lib/motion";

const CATEGORIES = [
  {
    id: "necessary",
    title: "Necesarias",
    text: "Mantienen tu sesión iniciada y la seguridad de la cuenta. Siempre activas.",
    locked: true,
  },
  {
    id: "preferences",
    title: "Preferencias",
    text: "Recuerdan tu color de tema, la vista del calendario y otros ajustes.",
  },
  {
    id: "analytics",
    title: "Analítica",
    text: "Nos muestran qué pantallas se usan para mejorar StudyFlow. Los datos son agregados.",
  },
];

// Se crea cada vez que se abre el panel, así parte de lo que ya eligió la persona
function PrefsPanel() {
  const { consent, decided, acceptAll, save, closePrefs } = useConsent();
  const [draft, setDraft] = useState(() => ({
    preferences: Boolean(consent?.preferences),
    analytics: Boolean(consent?.analytics),
  }));

  return (
    <>
      <p>Activa solo lo que quieras. Puedes cambiarlo cuando quieras desde el pie de página.</p>
      <div className="sf-cookie-prefs">
        {CATEGORIES.map((c) => (
          <label key={c.id} className="sf-cookie-row">
            <div>
              <strong>{c.title}</strong>
              <span>{c.text}</span>
            </div>
            <span className="sf-switch">
              <input
                type="checkbox"
                checked={c.locked ? true : Boolean(draft[c.id])}
                disabled={c.locked}
                onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.checked }))}
                aria-label={c.title}
              />
              <i />
            </span>
          </label>
        ))}
      </div>
      <div className="sf-cookie__actions">
        <button
          className="btn sf-cookie-primary"
          onClick={() => save({ preferences: draft.preferences, analytics: draft.analytics })}
        >
          Guardar selección
        </button>
        <button className="btn sf-cookie-ghost" onClick={acceptAll}>Aceptar todas</button>
        {decided && (
          <button className="btn sf-cookie-ghost" onClick={closePrefs}>Cancelar</button>
        )}
      </div>
    </>
  );
}

export default function CookieBanner() {
  const { decided, acceptAll, rejectOptional, prefsOpen, openPrefs } = useConsent();
  const visible = !decided || prefsOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="cookie"
          className="sf-cookie"
          role="dialog"
          aria-modal="false"
          aria-labelledby="sf-cookie-title"
          {...pop}
        >
          <h2 id="sf-cookie-title">Tu privacidad, tú decides</h2>

          {prefsOpen ? (
            <PrefsPanel />
          ) : (
            <>
              <p>
                Usamos cookies para que tu sesión funcione y, si lo permites, para recordar tus
                preferencias y mejorar la app. Lee cómo tratamos tus datos en la{" "}
                <Link to="/politica-de-datos">política de tratamiento de datos</Link>.
              </p>
              <div className="sf-cookie__actions">
                <button className="btn sf-cookie-primary" onClick={acceptAll}>Aceptar todas</button>
                <button className="btn sf-cookie-ghost" onClick={rejectOptional}>Solo necesarias</button>
                <button className="btn sf-cookie-ghost" onClick={openPrefs}>Configurar</button>
              </div>
            </>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
