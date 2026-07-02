import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserProfile, clearError } from "../store/authSlice";
import { useTheme } from "../store/ThemeContext";

const SettingsModalContent = ({ user, loading, onClose }) => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [originalEmail, setOriginalEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState("");
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
    setName(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      dispatch(updateUserProfile({ name: value }));
    }, 500);
  };

  const handleSaveEmail = (e) => {
    e.preventDefault();
    setSuccess("");
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "El correo es requerido" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "El correo no es válido" });
      return;
    }
    if (email === originalEmail) return;
    dispatch(updateUserProfile({ email })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setOriginalEmail(email);
        setSuccess("Correo actualizado");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setErrors({ email: res.payload || "Error al actualizar correo" });
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

  const handleDeleteAccount = () => {
    if (deleteConfirm === user?.name) {
      alert("Función de eliminar cuenta no disponible aún");
      setShowDeleteModal(false);
      setDeleteConfirm("");
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
            <label className="ty-caption settings-label">Nombre</label>
            <input
              className="settings-input"
              type="text"
              value={name}
              onChange={(e) => autoSaveName(e.target.value)}
              required
            />
          </div>

          <form onSubmit={handleSaveEmail} noValidate>
            <div className="settings-field">
              <label className="ty-caption settings-label">Correo electrónico</label>
              <div className="settings-input-wrapper">
                <input
                  className={`settings-input ${errors.email ? 'settings-input-error' : ''}`}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: null })); }}
                  required
                />
                {email !== originalEmail && (
                  <button type="submit" className="settings-input-btn" disabled={loading}>
                    Guardar
                  </button>
                )}
              </div>
              {errors.email && <span className="settings-error">{errors.email}</span>}
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
            <div className="settings-theme-options">
              <button
                className={`settings-theme-option ${theme === "light" ? "active" : ""}`}
                onClick={() => { if (theme !== "light") toggleTheme(); }}
              >
                <div className="settings-theme-preview settings-theme-light">
                  <div className="settings-theme-bar" />
                  <div className="settings-theme-dots">
                    <div /><div /><div />
                  </div>
                </div>
                <span className="ty-body-sm">Claro</span>
              </button>
              <button
                className={`settings-theme-option ${theme === "dark" ? "active" : ""}`}
                onClick={() => { if (theme !== "dark") toggleTheme(); }}
              >
                <div className="settings-theme-preview settings-theme-dark">
                  <div className="settings-theme-bar" />
                  <div className="settings-theme-dots">
                    <div /><div /><div />
                  </div>
                </div>
                <span className="ty-body-sm">Oscuro</span>
              </button>
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
        <div className="settings-confirm-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>
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
            <button
              className="settings-btn-cancel"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (!isOpen) return null;

  return <SettingsModalContent user={user} loading={loading} onClose={onClose} />;
};

export default SettingsModal;
