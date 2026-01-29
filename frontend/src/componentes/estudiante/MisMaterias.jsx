import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BookOpen, 
  Calendar,
  Camera,
  LogOut,
  Menu,
  X,
  Search,
  User,
  Clock,
  MapPin
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

  // Sidebar Items
  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Mis Asistencias', icono: ClipboardList, ruta: '/estudiante/asistencias' },
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/estudiante/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/estudiante/horarios' },
    { id: 'registro-facial', nombre: 'Registro Facial', icono: Camera, ruta: '/estudiante/registro-facial' },
  ];

  useEffect(() => {
    cargarMateriasEstudiante();
  }, []);

  const cargarMateriasEstudiante = async () => {
    try {
      setCargando(true);
      // El backend ya filtra por rol de Estudiante gracias a la actualización en PHP
      const response = await obtenerMaterias();
      if (response.exito) {
        setMaterias(response.datos || []);
      } else {
        setAlerta({ mostrar: true, tipo: 'error', mensaje: response.mensaje });
      }
    } catch (error) {
      console.error(error);
      setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Error al conectar con el servidor' });
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const materiasFiltradas = materias.filter(m => 
    m.nombre_materia.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nombre_docente.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ESTUDIANTE</h2>
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
                className={`sidebar-item ${item.ruta === '/estudiante/materias' ? 'activo' : ''}`}
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

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="btn-menu-mobile" onClick={() => setMenuAbierto(!menuAbierto)}>
            <Menu size={24} />
          </button>
          <h1>Mis Materias Inscritas</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        <main className="dashboard-content">
          {alerta.mostrar && (
            <AlertaDialogo {...alerta} onClose={() => setAlerta({ ...alerta, mostrar: false })} />
          )}

          {/* Buscador */}
          <div className="card" style={{ padding: '15px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por materia o docente..." 
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
                  <p>No estás inscrito en ninguna materia o no hay coincidencias.</p>
                </div>
              ) : (
                <div className="clases-grid">
                  {materiasFiltradas.map((materia) => (
                    <div key={materia.id_materia} className="card" style={{ transition: 'transform 0.2s', borderLeft: '4px solid #3b82f6' }}>
                      <div className="card-header" style={{ paddingBottom: '10px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>{materia.nombre_materia}</h3>
                      </div>
                      
                      <div style={{ padding: '0 20px 20px 20px' }}>
                        <div style={{ marginBottom: '15px' }}>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            backgroundColor: '#eff6ff', 
                            color: '#1d4ed8', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {materia.carrera}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="#64748b" />
                            <span><strong>Docente:</strong> {materia.nombre_docente}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} color="#64748b" />
                            <span>{materia.dia} {materia.hora_inicio} - {materia.hora_fin}</span>
                          </div>
                        </div>
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