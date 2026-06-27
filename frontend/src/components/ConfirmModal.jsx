import ModalPortal from "./ModalPortal";

const ConfirmModal = ({ title, message, confirmLabel, onConfirm, onCancel, danger }) => {
  return (
    <ModalPortal>
      <div className="confirm-overlay" onClick={onCancel}>
        <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-modal-title">{title}</div>
          {message && <div className="confirm-modal-message">{message}</div>}
          <div className="confirm-modal-actions">
            <button
              className={`confirm-modal-btn confirm ${danger ? "danger" : ""}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button className="confirm-modal-btn cancel" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmModal;
