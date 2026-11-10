import { motion } from "framer-motion";
import { pageVariants } from "../lib/motion";

// Envuelve el contenido de cada página: <PageTransition>...</PageTransition>
export default function PageTransition({ children, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
