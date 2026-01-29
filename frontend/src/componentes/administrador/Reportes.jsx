import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, 
  Download, 
  ArrowLeft,
  Calendar,
  Menu,
  X as XClose,
  LogOut
} from 'lucide-react';
import { descargarReporteAsistencias } from '../../api/reportesApi';
import AlertaDialogo from '../comunes/AlertaDialogo';
import '../../estilos/dashboard.css';

const Reportes = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Primer día del mes
    fin: new Date().toISOString().split('T')[0] // Hoy
  });
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  const handleDescargar = async () => {
    setCargando(true);
    const resultado = await descargarReporteAsistencias(fechas.inicio, fechas.fin);
    setCargando(false);

    if (resultado.exito) {
      setAlerta({ mostrar: true, tipo: 'exito', mensaje: 'Reporte descargado exitosamente. Revisa tu carpeta de descargas.' });
    } else {
      setAlerta({ mostrar: true, tipo: 'error', mensaje: resultado.mensaje });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Menú del Admin
  const menuItems = [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Usuarios', ruta: '/admin/usuarios' },
    { nombre: 'Estudiantes', ruta: '/admin/estudiantes' },
    { nombre: 'Docentes', ruta: '/admin/docentes' },
    { nombre: 'Horarios', ruta: '/admin/horarios' },
    { nombre: 'Materias', ruta: '/admin/materias' },
    { nombre: 'Matrículas', ruta: '/admin/matriculas' },
    { nombre: 'Reportes', ruta: '/admin/reportes' }, // Nueva ruta
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ADMIN</h2>
          <button className="btn-cerrar-sidebar" onClick={() => setMenuAbierto(false)}>
            <XClose size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`sidebar-item ${item.nombre === 'Reportes' ? 'activo' : ''}`}
              onClick={() => {
                navigate(item.ruta);
                setMenuAbierto(false);
              }}
            >
              <span>{item.nombre}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-item sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="btn-menu-mobile" onClick={() => setMenuAbierto(!menuAbierto)}>
            <Menu size={24} />
          </button>
          <h1>Reportes de Asistencia</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        <main className="dashboard-content">
          {alerta.mostrar && (
            <AlertaDialogo 
              {...alerta} 
              onClose={() => setAlerta({ ...alerta, mostrar: false })} 
            />
          )}

          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-header flex-between">
              <h3>Generar Reporte CSV</h3>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={20} /> Volver
              </button>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  backgroundColor: '#ecfdf5', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <FileText size={40} color="#10b981" />
                </div>
                <p style={{ color: '#64748b' }}>
                  Descarga el historial completo de asistencias en formato Excel (CSV).
                  Puedes filtrar por rango de fechas.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Inicio</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ paddingLeft: '35px' }}
                    value={fechas.inicio}
                    onChange={(e) => setFechas({...fechas, inicio: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Fin</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ paddingLeft: '35px' }}
                    value={fechas.fin}
                    onChange={(e) => setFechas({...fechas, fin: e.target.value})}
                  />
                </div>
              </div>

              <button 
                className="btn btn-success" 
                style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}
                onClick={handleDescargar}
                disabled={cargando}
              >
                {cargando ? 'Generando...' : (
                  <>
                    <Download size={20} />
                    Descargar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reportes;