/**
 * Indicador visual del estado de guardado
 * Similar al indicador de Notion en la esquina superior derecha
 */

const SavingIndicator = ({ isSaving, lastSaved }) => {
  if (isSaving) {
    return (
      <div className="flex items-center space-x-1.5 text-gray-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
        </span>
        <span className="text-xs">Guardando...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-1.5 text-gray-500">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        <span className="text-xs">Guardado {lastSaved}</span>
      </div>
    );
  }

  return null;
};

export default SavingIndicator;
