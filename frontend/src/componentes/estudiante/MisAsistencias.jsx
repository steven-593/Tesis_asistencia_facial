import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardList,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Filter
} from 'lucide-react';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import { obtenerAsistenciasPorEstudiante, obtenerEstadisticasEstudiante } from '../../api/asistenciasApi';
import { obtenerEstudiantes } from '../../api/estudiantesApi';
import { obtenerMaterias } from '../../api/materiasApi';
import '../../estilos/dashboard.css';

const MisAsistencias = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [asistencias, setAsistencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [idEstudiante, setIdEstudiante] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  useEffect(() => {
    obtenerIdEstudiante();
    cargarMaterias();
  }, []);

  useEffect(() => {
    if (idEstudiante) {
      cargarAsistencias();
      cargarEstadisticas();
    }
  }, [idEstudiante, fechaInicio, fechaFin]);

  const obtenerIdEstudiante = async () => {
    if (!usuario?.id_usuario) {
      mostrarAlerta('error', 'No se pudo verificar la sesión del usuario.');
      return;
    }
    try {
      const response = await obtenerEstudiantes(usuario.id_usuario);
      if (response.exito && response.datos && response.datos.length > 0) {
        const estudiante = response.datos[0];
        if (estudiante && estudiante.id_estudiante) {
          setIdEstudiante(estudiante.id_estudiante);
        } else {
          mostrarAlerta('error', 'No se encontró información de estudiante válida.');
        }
      } else {
        mostrarAlerta('error', response.mensaje || 'No se encontró información del estudiante.');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al obtener datos del estudiante');
    }
  };

  const cargarMaterias = async () => {
    try {
      const response = await obtenerMaterias();
      if (response.exito) {
        setMaterias(response.datos || []);
      }
    } catch (error) {
      console.error('Error al cargar materias:', error);
    }
  };

  const cargarAsistencias = async () => {
    try {
      setCargando(true);
      const response = await obtenerAsistenciasPorEstudiante(
        idEstudiante,
        fechaInicio || null,
        fechaFin || null
      );
      if (response.exito) {
        setAsistencias(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar asistencias');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await obtenerEstadisticasEstudiante(idEstudiante);
      if (response.exito) {
        setEstadisticas(response.datos);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
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

  const limpiarFiltros = () => {
    setMateriaFiltro('');
    setFechaInicio('');
    setFechaFin('');
  };

  const asistenciasFiltradas = asistencias.filter(asistencia => {
    if (materiaFiltro && asistencia.id_materia !== parseInt(materiaFiltro)) {
      return false;
    }
    return true;
  });

  const menuItems = [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Mis Asistencias', ruta: '/estudiante/asistencias' },
    { nombre: 'Mis Materias', ruta: '/estudiante/materias' },
    { nombre: 'Mis Horarios', ruta: '/estudiante/horarios' },
  ];

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
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="sidebar-item"
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

      {/* Contenido principal */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="btn-menu-mobile" onClick={() => setMenuAbierto(!menuAbierto)}>
            <Menu size={24} />
          </button>
          <h1>Mis Asistencias</h1>
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

          {/* Estadísticas */}
          {estadisticas && (
            <div className="estadisticas-grid" style={{ marginBottom: '24px' }}>
              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#dbeafe' }}>
                  <ClipboardList size={32} color="#3b82f6" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Total Registros</p>
                  <h3 className="estadistica-valor">{estadisticas.total_registros || 0}</h3>
                </div>
              </div>

              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#d1fae5' }}>
                  <CheckCircle size={32} color="#10b981" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Presentes</p>
                  <h3 className="estadistica-valor">{estadisticas.presentes || 0}</h3>
                </div>
              </div>

              <div className="estadistica-card">
                <div className="estadistica-icono" style={{ backgroundColor: '#fee2e2' }}>
                  <XCircle size={32} color="#ef4444" />
                </div>
                <div className="estadistica-info">
                  <p className="estadistica-titulo">Ausentes</p>
                  <h3 className="estadistica-valor">{estadisticas.ausentes || 0}</h3>
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

          {/* Filtros */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Filter size={20} style={{ marginRight: '8px' }} />
                Filtros
              </h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div className="form-group">
                  <label className="form-label">Materia</label>
                  <select
                    className="form-select"
                    value={materiaFiltro}
                    onChange={(e) => setMateriaFiltro(e.target.value)}
                  >
                    <option value="">Todas las materias</option>
                    {materias.map(materia => (
                      <option key={materia.id_materia} value={materia.id_materia}>
                        {materia.nombre_materia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Inicio</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Fin</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={limpiarFiltros}
                    style={{ width: '100%' }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Asistencias */}
          <div className="card">
            <div className="card-header">
              <div className="flex-between">
                <h3 className="card-title">Historial de Asistencias</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft size={20} />
                  Volver
                </button>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {cargando ? (
                <Cargando mensaje="Cargando asistencias..." />
              ) : asistenciasFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No hay asistencias registradas</p>
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Materia</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasFiltradas.map((asistencia) => (
                        <tr key={asistencia.id_asistencia}>
                          <td data-label="Fecha">
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
                          <td data-label="Hora">{asistencia.hora}</td>
                          <td data-label="Materia">
                            <strong>{asistencia.nombre_materia}</strong>
                            <br />
                            <small style={{ color: '#64748b' }}>{asistencia.carrera}</small>
                          </td>
                          <td data-label="Horario">
                            <small style={{ color: '#64748b' }}>
                              {asistencia.dia}<br />
                              {asistencia.hora_inicio} - {asistencia.hora_fin}
                            </small>
                          </td>
                          <td data-label="Estado">
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
                          <td data-label="Método">
                            <span style={{
                              fontSize: '0.85rem',
                              color: '#64748b',
                              padding: '4px 8px',
                              backgroundColor: '#f8fafc',
                              borderRadius: '6px'
                            }}>
                              {asistencia.metodo_registro}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MisAsistencias;