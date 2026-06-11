/**
 * Indicador visual del estado de guardado
 * Similar al indicador de Notion en la esquina superior derecha
 */

import { useState, useEffect } from "react";

function getRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "justo ahora";
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

const SavingIndicator = ({ lastSaved }) => {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!lastSaved) { setLabel(""); return; }
    const update = () => setLabel(getRelativeTime(lastSaved));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [lastSaved]);

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-1.5 text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        <span className="text-xs">Editado {label}</span>
      </div>
    );
  }

  return null;
};

export default SavingIndicator;
