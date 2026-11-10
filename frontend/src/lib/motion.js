// Requiere:  npm i framer-motion
export const ease = [0.22, 1, 0.36, 1];

/* Momento principal de cada pantalla: el contenedor escalona a sus hijos una sola vez al cargar */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

/* Cambio de ruta */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

/* Respuesta a acciones del usuario: tarjetas, botones, ítems de lista */
export const tap = { whileTap: { scale: 0.97 }, transition: { duration: 0.15 } };

/* Elementos que aparecen/desaparecen (modales, toasts, tareas completadas) */
export const pop = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.2 } },
};
