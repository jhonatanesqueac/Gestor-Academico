import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { stagger, rise } from "../lib/motion";
import { useConsent } from "../context/consentStore";

// Los textos marcados con <Todo> son datos tuyos: reemplázalos antes de publicar.
const Todo = ({ children }) => <mark className="sf-todo">{children}</mark>;

export default function PoliticaDatos() {
  const { openPrefs } = useConsent();

  return (
    <main className="sf-legal">
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={rise}><Link to="/login" className="sf-muted">← Volver</Link></motion.div>

        <motion.h1 variants={rise}>Política de tratamiento de datos personales</motion.h1>
        <motion.p variants={rise}>
          Última actualización: 29 de octubre de 2026. StudyFlow es un proyecto académico con fines educativos y sin fines comerciales; los datos de esta política son simulados. Esta política explica qué datos recoge StudyFlow, para qué
          los usa y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012 y sus decretos
          reglamentarios (Colombia).
        </motion.p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          Oscar Vizcaino, estudiantes y desarrolladores del proyecto académico StudyFlow, domicilio en{" "}
          <Todo>Barranquilla, Colombia</Todo>. Correo de contacto para asuntos de datos: StudyFlow@outlook.com.
        </p>

        <h2>2. Datos que recogemos</h2>
        <ul>
          <li>Datos de cuenta: nombre de usuario, correo electrónico y contraseña (almacenada cifrada).</li>
          <li>Datos académicos que tú registras: asignaturas, tareas, fechas de entrega, notas y calendario.</li>
          <li>Datos técnicos: dirección IP, tipo de dispositivo y navegador, y registros de acceso.</li>
          <li>Preferencias de la app: tema de color, vistas y ajustes.</li>
        </ul>
        <p>No solicitamos datos sensibles. Si no lo necesitas, no los ingreses en campos de texto libre.</p>

        <h2>3. Finalidades</h2>
        <ul>
          <li>Crear y administrar tu cuenta y autenticarte.</li>
          <li>Organizar tus tareas, asignaturas y alertas, incluidas las sugerencias de la función de IA.</li>
          <li>Garantizar la seguridad y prevenir el uso indebido.</li>
          <li>Mejorar el servicio con estadísticas agregadas, solo si aceptas las cookies de analítica.</li>
          <li>Enviarte avisos del servicio. Los avisos comerciales solo si los autorizas.</li>
        </ul>

        <h2>4. Tus derechos como titular</h2>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Solicitar prueba de la autorización otorgada.</li>
          <li>Ser informado del uso que se ha dado a tus datos.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
          <li>Revocar la autorización y solicitar la supresión de tus datos, salvo deber legal o contractual de conservarlos.</li>
          <li>Acceder gratuitamente a tus datos personales.</li>
        </ul>
        <p>
          Para ejercerlos escribe a StudyFlow@outlook.com. Responderemos las consultas en máximo
          10 días hábiles y los reclamos en máximo 15 días hábiles.
        </p>

        <h2>5. Menores de edad</h2>
        <p>
          Si eres menor de 18 años, el tratamiento de tus datos requiere autorización de tu representante legal
          y se hará respetando tu interés superior. StudyFlow está pensado para estudiantes.
        </p>

        <h2>6. Encargados y transferencias</h2>
        <p>
          Podemos apoyarnos en proveedores de alojamiento y de IA que tratan datos por nuestra cuenta y bajo
          nuestras instrucciones: Google (servicio Gemini), que procesa el texto que envías al asistente de IA, y el servicio de alojamiento del proyecto. . No vendemos tus datos.
        </p>

        <h2>7. Conservación</h2>
        <p>
          Guardamos tus datos mientras tu cuenta esté activa y hasta 30 días después de eliminarla,
          salvo que la ley exija conservarlos más tiempo.
        </p>

        <h2>8. Cookies</h2>
        <table>
          <thead>
            <tr><th>Categoría</th><th>Para qué sirve</th><th>Ejemplos</th><th>Duración</th></tr>
          </thead>
          <tbody>
            <tr><td>Necesarias</td><td>Sesión y seguridad. No se pueden desactivar.</td><td>cookie de refresco de sesión y sf_consent (almacenamiento local)</td><td>Sesión / 12 meses</td></tr>
            <tr><td>Preferencias</td><td>Recordar tema y ajustes.</td><td><Todo>sf_theme</Todo></td><td>12 meses</td></tr>
            <tr><td>Analítica</td><td>Medir el uso de la app de forma agregada.</td><td>Ninguna por ahora</td><td>No aplica</td></tr>
          </tbody>
        </table>
        <p>
          Puedes cambiar tu elección en cualquier momento:{" "}
          <button className="btn btn-secundario" style={{ padding: "8px 14px" }} onClick={openPrefs}>
            Configurar cookies
          </button>
        </p>

        <h2>9. Cambios en esta política</h2>
        <p>Si la modificamos de forma importante, te avisaremos en la app y, si aplica, volveremos a pedir tu autorización.</p>
      </motion.div>
    </main>
  );
}
