/**
 * Indicador visual del estado de guardado
 * Similar al indicador de Notion en la esquina superior derecha
 */

import { useState, useEffect } from "react";

function getRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "justo ahora";
  if (mins < 60) return mins === 1 ? "hace 1 min" : `hace ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "hace 1 hora" : `hace ${hours} horas`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "hace 1 día" : `hace ${days} días`;

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  if (days < 30) {
    if (weeks === 1 && remainingDays === 0) return "hace 1 semana";
    if (weeks === 1) return `hace 1 semana y ${remainingDays} ${remainingDays === 1 ? "día" : "días"}`;
    if (remainingDays === 0) return `hace ${weeks} semanas`;
    return `hace ${weeks} semanas y ${remainingDays} ${remainingDays === 1 ? "día" : "días"}`;
  }

  const months = Math.floor(days / 30);
  const remainingDaysAfterMonth = days % 30;

  if (days < 365) {
    if (months === 1 && remainingDaysAfterMonth === 0) return "hace 1 mes";
    if (months === 1) return `hace 1 mes y ${remainingDaysAfterMonth} ${remainingDaysAfterMonth === 1 ? "día" : "días"}`;
    if (remainingDaysAfterMonth === 0) return `hace ${months} meses`;
    return `hace ${months} meses y ${remainingDaysAfterMonth} ${remainingDaysAfterMonth === 1 ? "día" : "días"}`;
  }

  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);

  if (remainingMonths === 0) return years === 1 ? "hace 1 año" : `hace ${years} años`;
  return years === 1
    ? `hace 1 año y ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`
    : `hace ${years} años y ${remainingMonths} ${remainingMonths === 1 ? "mes" : "meses"}`;
}

const SavingIndicator = ({ lastSaved }) => {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!lastSaved) return;
    const id = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, [lastSaved]);

  if (!lastSaved) return null;

  return (
    <div className="flex items-center space-x-1.5 text-gray-500">
      <span className="h-2 w-2 rounded-full bg-green-500"></span>
      <span className="text-xs">Editado {getRelativeTime(lastSaved)}</span>
    </div>
  );
};

export default SavingIndicator;
