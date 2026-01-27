import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ClipboardList,
  Plus,
  Trash2,
  Search,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  User,
  BookOpen,
  Calendar
} from 'lucide-react';
import Modal from '../comunes/Modal';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import {
  obtenerMatriculas,
  crearMatricula,
  eliminarMatricula
} from '../../api/matriculasApi';
import { obtenerEstudiantes } from '../../api/estudiantesApi';
import { obtenerMaterias } from '../../api/materiasApi';
import '../../estilos/dashboard.css';

const Matriculas = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [matriculas, setMatriculas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_estudiante: '',
    id_materia: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await Promise.all([
        cargarMatriculas(),
        cargarEstudiantes(),
        cargarMaterias()
      ]);
    } finally {
      setCargando(false);
    }
  };

  const cargarMatriculas = async () => {
    try {
      const response = await obtenerMatriculas();
      if (response.exito) {
        setMatriculas(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar matrículas');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al conectar con el servidor');
    }
  };

  const cargarEstudiantes = async () => {
    try {
      const response = await obtenerEstudiantes();
      if (response.exito) {
        setEstudiantes(response.datos || []);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
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

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: '', mensaje: '' });
    }, 4000);
  };

  const abrirModalNuevo = () => {
    setFormulario({
      id_estudiante: '',
      id_materia: ''
    });
    setModalAbierto(true);
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formulario.id_estudiante || !formulario.id_materia) {
      mostrarAlerta('advertencia', 'Por favor selecciona un estudiante y una materia');
      return;
    }

    // Verificar si ya existe la matrícula
    const yaMatriculado = matriculas.some(
      m => m.id_estudiante === parseInt(formulario.id_estudiante) && 
           m.id_materia === parseInt(formulario.id_materia)
    );

    if (yaMatriculado) {
      mostrarAlerta('advertencia', 'El estudiante ya está matriculado en esta materia');
      return;
    }

    try {
      setCargando(true);
      const response = await crearMatricula(formulario);

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarMatriculas();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al crear la matrícula');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta matrícula?')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarMatricula(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarMatriculas();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar la matrícula');
    } finally {
      setCargando(false);
    }
  };

  const matriculasFiltradas = matriculas.filter(m =>
    m.nombre_estudiante?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.codigo_estudiante?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nombre_materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.carrera?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { nombre: 'Dashboard', ruta: '/dashboard' },
    { nombre: 'Usuarios', ruta: '/admin/usuarios' },
    { nombre: 'Estudiantes', ruta: '/admin/estudiantes' },
    { nombre: 'Docentes', ruta: '/admin/docentes' },
    { nombre: 'Horarios', ruta: '/admin/horarios' },
    { nombre: 'Materias', ruta: '/admin/materias' },
    { nombre: 'Matrículas', ruta: '/admin/matriculas' },
  ];

  // Obtener materias disponibles para el estudiante seleccionado (de su carrera)
  const materiasDisponibles = formulario.id_estudiante 
    ? materias.filter(m => {
        const estudiante = estudiantes.find(e => e.id_estudiante === parseInt(formulario.id_estudiante));
        return estudiante && m.carrera === estudiante.carrera;
      })
    : [];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ADMIN</h2>
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
          <h1>Gestión de Matrículas</h1>
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
                <button className="btn btn-primary" onClick={abrirModalNuevo}>
                  <Plus size={20} />
                  Nueva Matrícula
                </button>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <Search
                    size={20}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-light)'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por estudiante, código, materia o carrera..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando matrículas..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Estudiante</th>
                        <th>Código</th>
                        <th>Materia</th>
                        <th>Carrera</th>
                        <th>Horario</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron matrículas
                          </td>
                        </tr>
                      ) : (
                        matriculasFiltradas.map((m) => (
                          <tr key={m.id_matricula}>
                            <td data-label="ID">{m.id_matricula}</td>
                            <td data-label="Estudiante">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} color="#64748b" />
                                <span>{m.nombre_estudiante}</span>
                              </div>
                            </td>
                            <td data-label="Código"><strong>{m.codigo_estudiante}</strong></td>
                            <td data-label="Materia">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={16} color="#64748b" />
                                <span>{m.nombre_materia}</span>
                              </div>
                            </td>
                            <td data-label="Carrera">{m.carrera}</td>
                            <td data-label="Horario">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b' }}>
                                <Calendar size={14} />
                                <span>{m.dia} {m.hora_inicio}-{m.hora_fin}</span>
                              </div>
                            </td>
                            <td data-label="Acciones">
                              <div className="tabla-acciones">
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleEliminar(m.id_matricula)}
                                  title="Eliminar matrícula"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de formulario */}
      <Modal
        titulo="Nueva Matrícula"
        mostrar={modalAbierto}
        onClose={() => setModalAbierto(false)}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Estudiante *</label>
            <select
              name="id_estudiante"
              className="form-select"
              value={formulario.id_estudiante}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar estudiante</option>
              {estudiantes.map(e => (
                <option key={e.id_estudiante} value={e.id_estudiante}>
                  {e.codigo_estudiante} - {e.nombres} {e.apellidos} ({e.carrera})
                </option>
              ))}
            </select>
            {estudiantes.length === 0 && (
              <small style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                No hay estudiantes disponibles. Por favor, crea un estudiante primero.
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Materia *</label>
            <select
              name="id_materia"
              className="form-select"
              value={formulario.id_materia}
              onChange={handleChange}
              required
              disabled={!formulario.id_estudiante}
            >
              <option value="">
                {formulario.id_estudiante 
                  ? 'Seleccionar materia' 
                  : 'Primero selecciona un estudiante'}
              </option>
              {materiasDisponibles.map(m => (
                <option key={m.id_materia} value={m.id_materia}>
                  {m.nombre_materia} - {m.dia} ({m.hora_inicio} - {m.hora_fin})
                </option>
              ))}
            </select>
            {formulario.id_estudiante && materiasDisponibles.length === 0 && (
              <small style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                No hay materias disponibles para la carrera de este estudiante.
              </small>
            )}
            {formulario.id_estudiante && materiasDisponibles.length > 0 && (
              <small style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                Solo se muestran materias de {estudiantes.find(e => e.id_estudiante === parseInt(formulario.id_estudiante))?.carrera}
              </small>
            )}
          </div>

          {formulario.id_estudiante && formulario.id_materia && (
            <div style={{
              padding: '12px',
              backgroundColor: '#d1fae5',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {(() => {
                const estudiante = estudiantes.find(e => e.id_estudiante === parseInt(formulario.id_estudiante));
                const materia = materias.find(m => m.id_materia === parseInt(formulario.id_materia));
                if (estudiante && materia) {
                  return (
                    <div>
                      <p style={{ fontSize: '0.9rem', color: '#065f46', margin: '0 0 8px 0' }}>
                        <strong>Resumen de la matrícula:</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#065f46', margin: '0 0 4px 0' }}>
                        👤 <strong>Estudiante:</strong> {estudiante.nombres} {estudiante.apellidos}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#065f46', margin: '0 0 4px 0' }}>
                        📚 <strong>Materia:</strong> {materia.nombre_materia}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#065f46', margin: 0 }}>
                        📅 <strong>Horario:</strong> {materia.dia} de {materia.hora_inicio} a {materia.hora_fin}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="flex gap-8" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAbierto(false)}
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={cargando || estudiantes.length === 0 || materiasDisponibles.length === 0}
              style={{ flex: 1 }}
            >
              {cargando ? 'Guardando...' : 'Matricular'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Matriculas;