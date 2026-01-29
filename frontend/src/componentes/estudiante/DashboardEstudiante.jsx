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
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Cargando from '../comunes/Cargando';
import AlertaDialogo from '../comunes/AlertaDialogo';
import {
  obtenerEstadisticasEstudiante,
  obtenerAsistenciasPorEstudiante,
  obtenerAsistenciasHoy
} from '../../api/asistenciasApi';
import { obtenerEstudiantes } from '../../api/estudiantesApi';
import { obtenerMaterias } from '../../api/materiasApi';
import '../../estilos/dashboard.css';

const DashboardEstudiante = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [idEstudiante, setIdEstudiante] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [asistenciasRecientes, setAsistenciasRecientes] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Mis Asistencias', icono: ClipboardList, ruta: '/estudiante/asistencias' },
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/estudiante/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/estudiante/horarios' },
    { id: 'registro-facial', nombre: 'Registro Facial', icono: Camera, ruta: '/estudiante/registro-facial' },
  ];

  useEffect(() => {
    inicializarDatos();
  }, []);

  const inicializarDatos = async () => {
    try {
      setCargando(true);
      
      // Obtener ID del estudiante
      const estudiantesResponse = await obtenerEstudiantes();
      if (estudiantesResponse.exito && estudiantesResponse.datos) {
        const estudiante = estudiantesResponse.datos.find(
          e => e.id_usuario === usuario.id_usuario
        );
        if (estudiante) {
          setIdEstudiante(estudiante.id_estudiante);
          
          // Cargar datos en paralelo
          await Promise.all([
            cargarEstadisticas(estudiante.id_estudiante),
            cargarAsistenciasRecientes(estudiante.id_estudiante),
            cargarAsistenciasHoy(estudiante.id_estudiante),
            cargarMaterias()
          ]);
        } else {
          mostrarAlerta('error', 'No se encontró información del estudiante');
        }
      }
    } catch (error) {
      console.error('Error al inicializar datos:', error);
      mostrarAlerta('error', 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async (idEst) => {
    try {
      const response = await obtenerEstadisticasEstudiante(idEst);
      if (response.exito) {
        setEstadisticas(response.datos || {
          total_registros: 0,
          presentes: 0,
          ausentes: 0,
          porcentaje_asistencia: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const cargarAsistenciasRecientes = async (idEst) => {
    try {
      const response = await obtenerAsistenciasPorEstudiante(idEst);
      if (response.exito && response.datos) {
        // Obtener solo las últimas 5 asistencias
        setAsistenciasRecientes(response.datos.slice(0, 5));
      }
    } catch (error) {
      console.error('Error al cargar asistencias recientes:', error);
    }
  };

  const cargarAsistenciasHoy = async (idEst) => {
    try {
      const response = await obtenerAsistenciasHoy(idEst);
      if (response.exito && response.datos) {
        setAsistenciasHoy(response.datos);
      }
    } catch (error) {
      console.error('Error al cargar asistencias de hoy:', error);
    }
  };

  const cargarMaterias = async () => {
    try {
      const response = await obtenerMaterias();
      if (response.exito && response.datos) {
        setMaterias(response.datos);
      }
    } catch (error) {
      console.error('Error al cargar materias:', error);
    }
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: '', mensaje: '' });
    }, 4000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNombreMateria = (idMateria) => {
    const materia = materias.find(m => m.id_materia === idMateria);
    return materia?.nombre_materia || 'Materia no identificada';
  };

  if (cargando) {
    return (
      <div className="dashboard-container">
        <Cargando mensaje="Cargando panel del estudiante..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ESTUDIANTE</h2>
          <button 
            className="btn-cerrar-sidebar"
            onClick={() => setMenuAbierto(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icono = item.icono;
            return (
              <button
                key={item.id}
                className="sidebar-item"
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

      {/* Contenido principal */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button 
            className="btn-menu-mobile"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <Menu size={24} />
          </button>
          <h1>Panel del Estudiante</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        <main className="dashboard-content">
          {alerta.mostrar && (
            <AlertaDialogo
              tipo={alerta.tipo}
              mensaje={alerta.mensaje}
              mostrar={alerta.mostrar}
              onClose={() => setAlerta({ ...alerta, mostrar: false })}
            />
          )}

          <div className="bienvenida">
            <div>
              <h2>¡Bienvenido, {usuario?.nombres}!</h2>
              <p>Aquí puedes visualizar tu información de asistencias</p>
            </div>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <div className="estadisticas-grid">
              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#dbeafe' }}>
                  <ClipboardList size={32} color="#3b82f6" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Total Registros</p>
                  <h3 className="estadistica-valor">
                    {estadisticas.total_registros || 0}
                  </h3>
                </div>
              </div>

              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#d1fae5' }}>
                  <CheckCircle size={32} color="#10b981" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Presentes</p>
                  <h3 className="estadistica-valor">
                    {estadisticas.presentes || 0}
                  </h3>
                </div>
              </div>

              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#fee2e2' }}>
                  <XCircle size={32} color="#ef4444" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Ausentes</p>
                  <h3 className="estadistica-valor">
                    {estadisticas.ausentes || 0}
                  </h3>
                </div>
              </div>

              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#fef3c7' }}>
                  <TrendingUp size={32} color="#f59e0b" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Porcentaje</p>
                  <h3 className="estadistica-valor">
                    {estadisticas.porcentaje_asistencia 
                      ? `${parseFloat(estadisticas.porcentaje_asistencia).toFixed(1)}%`
                      : '0%'}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Asistencias de Hoy */}
          {asistenciasHoy.length > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <h3 className="card-title">
                  <Clock size={20} style={{ marginRight: '8px' }} />
                  Asistencias de Hoy
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {asistenciasHoy.map((asistencia) => (
                    <div 
                      key={asistencia.id_asistencia}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${asistencia.estado === 'Presente' ? '#10b981' : '#ef4444'}`,
                        backgroundColor: asistencia.estado === 'Presente' ? '#ecfdf5' : '#fef2f2'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {asistencia.estado === 'Presente' ? (
                          <CheckCircle size={20} color="#10b981" />
                        ) : (
                          <XCircle size={20} color="#ef4444" />
                        )}
                        <strong>{getNombreMateria(asistencia.id_materia)}</strong>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        <p>Hora: {asistencia.hora}</p>
                        <p>Estado: <strong style={{ color: asistencia.estado === 'Presente' ? '#10b981' : '#ef4444' }}>
                          {asistencia.estado}
                        </strong></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accesos rápidos */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Accesos Rápidos</h3>
            </div>
            <div className="accesos-rapidos">
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/asistencias')}
              >
                <ClipboardList size={24} />
                <span>Ver Asistencias</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/materias')}
              >
                <BookOpen size={24} />
                <span>Mis Materias</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/horarios')}
              >
                <Calendar size={24} />
                <span>Ver Horarios</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/registro-facial')}
              >
                <Camera size={24} />
                <span>Registro Facial</span>
              </button>
            </div>
          </div>

          {/* Asistencias Recientes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Asistencias Recientes</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {asistenciasRecientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No hay asistencias registradas</p>
                </div>
              ) : (
                <>
                  <div className="tabla-contenedor">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Materia</th>
                          <th>Hora</th>
                          <th>Estado</th>
                          <th>Método</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistenciasRecientes.map((asistencia) => (
                          <tr key={asistencia.id_asistencia}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={16} color="#64748b" />
                                {new Date(asistencia.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </td>
                            <td>
                              <strong>{getNombreMateria(asistencia.id_materia)}</strong>
                            </td>
                            <td>{asistencia.hora}</td>
                            <td>
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: asistencia.estado === 'Presente' ? '#d1fae5' : '#fee2e2',
                                color: asistencia.estado === 'Presente' ? '#065f46' : '#991b1b'
                              }}>
                                {asistencia.estado === 'Presente' ? (
                                  <>
                                    <CheckCircle size={16} />
                                    Presente
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} />
                                    Ausente
                                  </>
                                )}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.85rem',
                                color: '#64748b',
                                padding: '4px 8px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px'
                              }}>
                                {asistencia.metodo_registro || 'Manual'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => navigate('/estudiante/asistencias')}
                    >
                      Ver más asistencias
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardEstudiante;