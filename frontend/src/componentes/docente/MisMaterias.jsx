import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BookOpen, 
  Calendar,
  LogOut,
  Menu,
  X,
  Search,
  Clock,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import Cargando from '../comunes/Cargando';
import AlertaDialogo from '../comunes/AlertaDialogo';
import { obtenerMaterias } from '../../api/materiasApi';
import '../../estilos/dashboard.css';

const MisMaterias = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Estados
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Menú lateral
  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Tomar Asistencia', icono: ClipboardList, ruta: '/docente/asistencias' },
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/docente/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/docente/horarios' },
  ];

  useEffect(() => {
    cargarMateriasDocente();
  }, []);

  const cargarMateriasDocente = async () => {
    try {
      setCargando(true);
      const response = await obtenerMaterias();
      if (response.exito) {
        setMaterias(response.datos || []);
      } else {
        setAlerta({ mostrar: true, tipo: 'error', mensaje: 'No se pudieron cargar las materias' });
      }
    } catch (error) {
      console.error(error);
      setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Error de conexión' });
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filtrado de búsqueda
  const materiasFiltradas = materias.filter(m => 
    m.nombre_materia.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.carrera.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>DOCENTE</h2>
          <button className="btn-cerrar-sidebar" onClick={() => setMenuAbierto(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icono = item.icono;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${item.ruta === '/docente/materias' ? 'activo' : ''}`}
                onClick={() => {
                  navigate(item.ruta);
                  setMenuAbierto(false);
                }}
              >
                <Icono size={20} />
                <span>{item.nombre}</span>
              </button>
            );
          })}
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
          <h1>Mis Materias Asignadas</h1>
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

          {/* Barra de Búsqueda */}
          <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar materia o carrera..." 
                style={{ paddingLeft: '40px' }}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {cargando ? (
            <Cargando mensaje="Cargando tus materias..." />
          ) : (
            <>
              {materiasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No tienes materias asignadas o no coinciden con tu búsqueda.</p>
                </div>
              ) : (
                <div className="clases-grid">
                  {materiasFiltradas.map((materia) => (
                    <div key={materia.id_materia} className="card hover-scale" style={{ transition: 'transform 0.2s' }}>
                      <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>{materia.nombre_materia}</h3>
                      </div>
                      
                      <div style={{ padding: '0 20px 20px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#64748b' }}>
                          <GraduationCap size={18} />
                          <span>{materia.carrera}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#64748b' }}>
                          <Clock size={18} />
                          <span>{materia.dia} {materia.hora_inicio} - {materia.hora_fin}</span>
                        </div>

                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                          onClick={() => navigate('/docente/asistencias')}
                        >
                          Ir a Asistencia <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MisMaterias;