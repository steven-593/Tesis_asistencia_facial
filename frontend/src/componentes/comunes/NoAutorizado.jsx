import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const NoAutorizado = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        maxWidth: '500px'
      }}>
        <ShieldAlert size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '12px', color: '#1e293b' }}>
          Acceso Denegado
        </h1>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '1.1rem' }}>
          No tienes permisos para acceder a esta página
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
          style={{ marginTop: '16px' }}
        >
          <ArrowLeft size={20} />
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default NoAutorizado;