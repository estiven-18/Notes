import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserProfile, deleteAccount, clearError, logout } from "../store/authSlice";

const SettingsModalContent = ({ user, loading, onClose, onWorkspaceNameChange }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState("");
  const [workspaceName, setWorkspaceName] = useState(() => {
    const stored = localStorage.getItem('workspaceName');
    if (stored) return stored;
    const defaultName = user?.name || "";
    localStorage.setItem('workspaceName', defaultName);
    return defaultName;
  });
  const [workspaceNameError, setWorkspaceNameError] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [originalEmail, setOriginalEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const autoSaveName = (value) => {
    if (value.length > 30) {
      setNameError("Máximo 30 caracteres");
      return;
    }
    if (value.length > 0 && value.trim().length === 0) {
      setNameError("El nombre no puede estar vacío");
      return;
    }
    if (value.length > 0 && value.trim().length < 1) {
      setNameError("Mínimo 1 carácter");
      return;
    }
    setName(value);
    setNameError("");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (value.trim().length > 0) {
        dispatch(updateUserProfile({ name: value }));
      }
    }, 500);
  };

  const handleWorkspaceName = (value) => {
    if (value.length <= 20) {
      setWorkspaceName(value);
      setWorkspaceNameError("");
      if (value.trim()) {
        localStorage.setItem('workspaceName', value);
        if (onWorkspaceNameChange) onWorkspaceNameChange(value);
      }
    } else {
      setWorkspaceNameError("Máximo 20 caracteres");
    }
  };

  const handleSaveEmail = (e) => {
    e.preventDefault();
    setSuccess("");
    setEmailError("");
    if (!email.trim()) {
      setEmailError("El correo es requerido");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("El correo no es válido");
      return;
    }
    if (email === originalEmail) return;
console.log("Sending email update:", email);
    dispatch(updateUserProfile({ email })).then((res) => {
      console.log("Email update response:", res);
      if (res.meta.requestStatus === "fulfilled") {
        setOriginalEmail(email);
        setSuccess("Correo actualizado");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        let msg = res.payload || "Error al actualizar correo";
        const lower = msg.toLowerCase();
        console.log("Email update error:", msg);
        if (lower.includes("validation failed") || lower.includes("email inválido") || lower.includes("email invalido") || lower.includes("invalid email") || lower.includes("user validation failed") || lower.includes("correo no es válido") || lower.includes("correo invalido")) {
          msg = "El correo no es válido";
        } else if (lower.includes("el email ya está en uso") || lower.includes("el email ya esta en uso") || lower.includes("ya está en uso") || lower.includes("duplicate") || lower.includes("11000")) {
          msg = "El correo ya está en uso";
        }
        setEmailError(msg);
      }
    });
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});
    if (!password) {
      setErrors({ password: "La contraseña es requerida" });
      return;
    }
    if (password.length < 6) {
      setErrors({ password: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    dispatch(updateUserProfile({ password })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setSuccess("Contraseña actualizada");
        setPassword("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setErrors({ password: res.payload || "Error al actualizar contraseña" });
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm === user?.name) {
      try {
        await dispatch(deleteAccount()).unwrap();
        setShowDeleteModal(false);
        setDeleteConfirm("");
        onClose();
        dispatch(logout());
        window.location.href = '/login';
      } catch (err) {
        setDeleteError(err || "Error al eliminar cuenta");
      }
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <span className="ty-heading-3">Ajustes</span>
          <button className="settings-close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-profile-card">
            <div className="settings-avatar-lg">{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div>
              <div className="ty-body-md" style={{ fontWeight: 600 }}>{user?.name || "Usuario"}</div>
              <div className="ty-caption" style={{ color: "var(--color-ink-muted)" }}>{user?.email}</div>
            </div>
          </div>

          {success && <div className="settings-success">{success}</div>}

          <div className="settings-field">
            <label className="ty-caption settings-label">Nombre del perfil</label>
            <input
              className={`settings-input ${nameError ? 'input-error' : ''}`}
              type="text"
              value={name}
              onChange={(e) => autoSaveName(e.target.value)}
              maxLength={30}
              required
            />
            {nameError && <div className="settings-field-error">{nameError}</div>}
          </div>

          <form onSubmit={handleSaveEmail} noValidate>
            <div className="settings-field">
              <label className="ty-caption settings-label">Correo electrónico</label>
              <div className="settings-input-wrapper">
                <input
                  className={`settings-input ${emailError ? 'input-error' : ''}`}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  required
                />
                {email !== originalEmail && (
                  <button type="submit" className="settings-input-btn" disabled={loading}>
                    Guardar
                  </button>
                )}
              </div>
              {emailError && <div className="settings-field-error">{emailError}</div>}
            </div>
          </form>

          <form onSubmit={handleSavePassword}>
            <div className="settings-field">
              <label className="ty-caption settings-label">Nueva contraseña</label>
              <div className="settings-input-wrapper">
                <input
                  className={`settings-input ${errors.password ? 'settings-input-error' : ''}`}
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: null })); }}
                  minLength={6}
                  placeholder="Dejar vacío para mantener actual"
                />
                {password && (
                  <button type="submit" className="settings-input-btn" disabled={loading}>
                    Guardar
                  </button>
                )}
              </div>
              {errors.password && <span className="settings-error">{errors.password}</span>}
            </div>
          </form>

          <div className="settings-divider" />

          <div className="settings-group">
            <h3 className="ty-title settings-group-title">Apariencia</h3>
            <div className="settings-field">
              <label className="ty-caption settings-label">Nombre del espacio de trabajo</label>
              <input
                className={`settings-input ${workspaceNameError ? 'input-error' : ''}`}
                type="text"
                value={workspaceName}
                onChange={(e) => handleWorkspaceName(e.target.value)}
                maxLength={20}
                required
              />
              {workspaceNameError && <div className="settings-field-error">{workspaceNameError}</div>}
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-group">
            <h3 className="ty-title" style={{ marginBottom: 12 }}>Zona de riesgo</h3>
            <div className="settings-danger-row">
              <div>
                <div className="ty-body-md" style={{ fontWeight: 500 }}>Eliminar cuenta</div>
                <div className="ty-caption" style={{ color: "var(--color-ink-muted)", marginTop: 2 }}>
                  Se eliminará de forma permanente tu cuenta, incluidas todas las páginas y archivos.
                </div>
              </div>
              <button className="settings-btn-danger-text" onClick={() => setShowDeleteModal(true)}>
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="settings-confirm-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }}>
          <div className="settings-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-confirm-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path stroke="#dc2626" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v4m0 4h.01M10.615 3.892 2.39 18.098c-.456.788-.684 1.182-.65 1.506a1 1 0 0 0 .406.705c.263.191.718.191 1.629.191h16.45c.91 0 1.365 0 1.628-.191a1 1 0 0 0 .407-.705c.034-.324-.195-.718-.65-1.506L13.383 3.892c-.454-.785-.681-1.178-.978-1.31a1 1 0 0 0-.813 0c-.296.132-.523.525-.978 1.31Z" />
              </svg>
            </div>
            <h3 className="ty-heading-3" style={{ textAlign: "center", marginBottom: 8 }}>
              ¿Deseas eliminar tu cuenta de forma permanente?
            </h3>
            <p className="ty-body-sm" style={{ color: "var(--color-ink-muted)", textAlign: "center", marginBottom: 20 }}>
              Esta acción no se puede deshacer. Se eliminará de forma permanente tu cuenta, incluyendo todas las páginas y archivos. Escribe tu nombre para confirmar.
            </p>
            <input
              className="settings-input"
              type="text"
              placeholder={user?.name || "Tu nombre"}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />
            <button
              className="settings-btn-danger-full"
              disabled={deleteConfirm !== user?.name}
              onClick={handleDeleteAccount}
            >
              Eliminar cuenta
            </button>
            {deleteError && <div style={{ color: "#e74c3c", fontSize: 12, marginTop: 8, textAlign: "center" }}>{deleteError}</div>}
            <button
              className="settings-btn-cancel"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(""); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose, onWorkspaceNameChange }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (!isOpen) return null;

  return <SettingsModalContent user={user} loading={loading} onClose={onClose} onWorkspaceNameChange={onWorkspaceNameChange} />;
};

export default SettingsModal;
