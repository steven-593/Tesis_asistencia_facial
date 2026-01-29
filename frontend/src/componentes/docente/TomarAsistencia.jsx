import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardList,
  Calendar,
  CheckCircle,
  XCircle,
  Menu,
  X as XClose,
  ArrowLeft,
  Camera, // <--- Importamos el icono de cámara
  LogOut
} from 'lucide-react';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import { obtenerMaterias } from '../../api/materiasApi';
import { obtenerMatriculas } from '../../api/matriculasApi';
import { registrarAsistencia, obtenerAsistenciasPorMateria } from '../../api/asistenciasApi';
import '../../estilos/dashboard.css';

const TomarAsistencia = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [materias, setMaterias] = useState([]);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistenciasDelDia, setAsistenciasDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarMaterias();
  }, []);

  const cargarMaterias = async () => {
    try {
      setCargando(true);
      const response = await obtenerMaterias();
      if (response.exito) {
        setMaterias(response.datos || []);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar materias');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstudiantesDeMateria = async (idMateria) => {
    try {
      setCargando(true);
      const response = await obtenerMatriculas();
      if (response.exito) {
        const estudiantesMateria = response.datos.filter(
          m => m.id_materia === parseInt(idMateria)
        );
        setEstudiantes(estudiantesMateria);
      }

      // Cargar asistencias del día
      const asistenciasResponse = await obtenerAsistenciasPorMateria(idMateria, fechaSeleccionada);
      if (asistenciasResponse.exito) {
        setAsistenciasDelDia(asistenciasResponse.datos || []);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cargar estudiantes');
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarMateria = (materia) => {
    setMateriaSeleccionada(materia);
    cargarEstudiantesDeMateria(materia.id_materia);
  };

  // --- NUEVA FUNCIÓN: IR AL ESCÁNER ---
  const abrirEscaner = () => {
    navigate('/docente/escaner', {
      state: {
        id_materia: materiaSeleccionada.id_materia,
        id_horario: materiaSeleccionada.id_horario,
        nombre_materia: materiaSeleccionada.nombre_materia
      }
    });
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: '', mensaje: '' });
    }, 4000);
  };

  const yaRegistrado = (idEstudiante) => {
    return asistenciasDelDia.some(a => a.id_estudiante === parseInt(idEstudiante));
  };

  const obtenerEstadoAsistencia = (idEstudiante) => {
    const asistencia = asistenciasDelDia.find(a => a.id_estudiante === parseInt(idEstudiante));
    return asistencia?.estado;
  };

  const marcarAsistencia = async (estudiante, estado) => {
    if (yaRegistrado(estudiante.id_estudiante)) {
      mostrarAlerta('advertencia', 'Este estudiante ya tiene asistencia registrada para hoy');
      return;
    }

    try {
      setGuardando(true);
      const datos = {
        id_estudiante: estudiante.id_estudiante,
        id_materia: materiaSeleccionada.id_materia,
        id_horario: materiaSeleccionada.id_horario,
        fecha: fechaSeleccionada,
        hora: new Date().toTimeString().split(' ')[0],
        estado: estado,
        metodo_registro: 'Manual'
      };

      const response = await registrarAsistencia(datos);
      
      if (response.exito) {
        mostrarAlerta('exito', `Asistencia marcada: ${estado}`);
        cargarEstudiantesDeMateria(materiaSeleccionada.id_materia);
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al registrar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Tomar Asistencia', ruta: '/docente/asistencias' },
    { nombre: 'Mis Materias', ruta: '/docente/materias' },
    { nombre: 'Mis Horarios', ruta: '/docente/horarios' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>DOCENTE</h2>
          <button className="btn-cerrar-sidebar" onClick={() => setMenuAbierto(false)}>
            <XClose size={24} />
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
          <h1>Tomar Asistencia</h1>
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

          <div className="card">
            <div className="card-header" style={{ justifyContent: 'flex-end' }}>
              <div className="flex gap-8">
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft size={20} />
                  Volver
                </button>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => {
                    setFechaSeleccionada(e.target.value);
                    if (materiaSeleccionada) {
                      cargarEstudiantesDeMateria(materiaSeleccionada.id_materia);
                    }
                  }}
                  className="form-input"
                  style={{ width: 'auto' }}
                />
              </div>
            </div>

            {!materiaSeleccionada ? (
              <div style={{ padding: '20px' }}>
                <h3>Selecciona una Materia</h3>
                {cargando ? (
                  <Cargando mensaje="Cargando materias..." />
                ) : (
                  <div className="clases-grid" style={{ marginTop: '20px' }}>
                    {materias.map((materia) => (
                      <div
                        key={materia.id_materia}
                        onClick={() => handleSeleccionarMateria(materia)}
                        style={{
                          padding: '20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <h4 style={{ marginTop: 0, color: '#1e293b' }}>{materia.nombre_materia}</h4>
                        <p style={{ color: '#64748b', margin: '8px 0' }}>{materia.carrera}</p>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                          📅 {materia.dia} | ⏰ {materia.hora_inicio} - {materia.hora_fin}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                <div className="materia-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{materiaSeleccionada.nombre_materia}</h3>
                    <p style={{ margin: '4px 0', color: '#64748b' }}>
                      {materiaSeleccionada.carrera} - {materiaSeleccionada.dia} {materiaSeleccionada.hora_inicio}-{materiaSeleccionada.hora_fin}
                    </p>
                  </div>
                  
                  {/* --- BOTONES DE ACCIÓN --- */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={abrirEscaner}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Camera size={20} />
                      Modo Automático (Cámara)
                    </button>

                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setMateriaSeleccionada(null);
                        setEstudiantes([]);
                        setAsistenciasDelDia([]);
                      }}
                    >
                      Cambiar Materia
                    </button>
                  </div>
                </div>

                {cargando ? (
                  <Cargando mensaje="Cargando estudiantes..." />
                ) : (
                  <>
                    {estudiantes.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No hay estudiantes matriculados en esta materia
                      </p>
                    ) : (
                      <div className="tabla-contenedor">
                        <table className="tabla">
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Estudiante</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {estudiantes.map((estudiante) => {
                              const yaRegistradoHoy = yaRegistrado(estudiante.id_estudiante);
                              const estadoAsistencia = obtenerEstadoAsistencia(estudiante.id_estudiante);

                              return (
                                <tr key={estudiante.id_estudiante}>
                                  <td data-label="Código"><strong>{estudiante.codigo_estudiante}</strong></td>
                                  <td data-label="Estudiante">{estudiante.nombre_estudiante}</td>
                                  <td data-label="Estado">
                                    {yaRegistradoHoy ? (
                                      <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        backgroundColor: estadoAsistencia === 'Presente' ? '#d1fae5' : '#fee2e2',
                                        color: estadoAsistencia === 'Presente' ? '#065f46' : '#991b1b'
                                      }}>
                                        {estadoAsistencia === 'Presente' ? '✅ Presente' : '❌ Ausente'}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>Sin registrar</span>
                                    )}
                                  </td>
                                  <td data-label="Acciones">
                                    <div className="tabla-acciones">
                                      <button
                                        className="btn btn-success"
                                        onClick={() => marcarAsistencia(estudiante, 'Presente')}
                                        disabled={yaRegistradoHoy || guardando}
                                        title="Marcar Presente"
                                      >
                                        <CheckCircle size={16} />
                                        Presente
                                      </button>
                                      <button
                                        className="btn btn-danger"
                                        onClick={() => marcarAsistencia(estudiante, 'Ausente')}
                                        disabled={yaRegistradoHoy || guardando}
                                        title="Marcar Ausente"
                                      >
                                        <XCircle size={16} />
                                        Ausente
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TomarAsistencia;