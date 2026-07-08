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

const SavingIndicator = ({ lastSaved, note }) => {
  const [, tick] = useState(0);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    const id = setInterval(() => tick(n => n + 1), 10000);
    return () => clearInterval(id);
  }, [lastSaved]);

  if (!lastSaved) return null;

  const authorName = note?.author?.name || note?.user?.name || "Desconocido";
  const updaterName = note?.lastUpdatedBy?.name || note?.user?.name || "Desconocido";
  const createdTime = note?.createdAt ? getRelativeTime(new Date(note.createdAt).getTime()) : "desconocido";
  const updatedTime = note?.updatedAt ? getRelativeTime(new Date(note.updatedAt).getTime()) : "desconocido";

  return (
    <div
      className="saving-indicator-wrapper"
      onMouseEnter={() => setShowActivity(true)}
      onMouseLeave={() => setShowActivity(false)}
    >
      <span className="text-xs saving-indicator-text">Última edición {getRelativeTime(lastSaved)}</span>
      {showActivity && (
        <div className="saving-indicator-dropdown">
          <div className="saving-indicator-dropdown-title">Actividad</div>
          <div className="saving-indicator-dropdown-item">
            <span>Editada por <strong>{updaterName}</strong></span>
            <span className="saving-indicator-dropdown-time">{updatedTime}</span>
          </div>
          <div className="saving-indicator-dropdown-item">
            <span>Creada por <strong>{authorName}</strong></span>
            <span className="saving-indicator-dropdown-time">{createdTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingIndicator;
