import { useState, useRef, useEffect } from "react";

const CreateModal = ({ title, placeholder, onSubmit, onClose }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={100}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-confirm"
              disabled={!value.trim()}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;
