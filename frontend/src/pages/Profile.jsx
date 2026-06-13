import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, clearError } from '../store/authSlice';

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess('');
    const payload = { name, email };
    if (password) {
      payload.password = password;
    }
    dispatch(updateUserProfile(payload)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setSuccess('Perfil actualizado correctamente');
        setPassword('');
        setTimeout(() => setSuccess(''), 3000);
      }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>Editar Perfil</h1>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', cursor: 'pointer', fontSize: 13 }}
          >
            Volver
          </button>
        </div>
        <p className="auth-subtitle">Actualiza tus datos</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 13, padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>{success}</div>}
          <div className="auth-field">
            <label htmlFor="name">Nombre</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Nueva contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Dejar vacío para mantener actual" />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
