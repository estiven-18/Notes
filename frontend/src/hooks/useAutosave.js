import { useEffect, useRef } from 'react';

/**
 * Hook de autoguardado con debounce
 * 
 * Guarda el contenido automáticamente después de que el usuario
 * deja de escribir por 2 segundos.
 * 
 * @param {Function} saveFn - Función que ejecuta el guardado
 * @param {Array} deps - Dependencias que activan el debounce
 * @param {number} delay - Milisegundos de delay (default: 2000)
 */
const useAutosave = (saveFn, deps = [], delay = 2000) => {
  const timeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFn();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
};

export default useAutosave;