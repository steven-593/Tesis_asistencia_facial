import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import Modal from '../comunes/Modal';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import {
  obtenerEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  obtenerUsuariosSinAsignar
} from '../../api/estudiantesApi';
import '../../estilos/dashboard.css';

const Estudiantes = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [estudiantes, setEstudiantes] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_estudiante: '',
    id_usuario: '',
    codigo_estudiante: '',
    carrera: '',
    semestre: ''
  });

  const carreras = [
    'Ingeniería en Sistemas',
    'Ingeniería Civil',
    'Medicina',
    'Derecho',
    'Administración de Empresas',
    'Contabilidad',
    'Marketing',
    'Enfermería',
    'Psicología',
    'Arquitectura'
  ];

  const semestres = [
    'Primero',
    'Segundo',
    'Tercero',
    'Cuarto',
    'Quinto',
    'Sexto',
    'Séptimo',
    'Octavo',
    'Noveno',
    'Décimo'
  ];

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setCargando(true);
      const response = await obtenerEstudiantes();
      if (response.exito) {
        setEstudiantes(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar estudiantes');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuariosDisponibles = async () => {
    try {
      const response = await obtenerUsuariosSinAsignar();
      if (response.exito) {
        setUsuariosDisponibles(response.datos || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    }
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: '', mensaje: '' });
    }, 4000);
  };

  const abrirModalNuevo = async () => {
    setModoEdicion(false);
    setFormulario({
      id_estudiante: '',
      id_usuario: '',
      codigo_estudiante: '',
      carrera: '',
      semestre: ''
    });
    await cargarUsuariosDisponibles();
    setModalAbierto(true);
  };

  const abrirModalEditar = (estudianteData) => {
    setModoEdicion(true);
    setFormulario({
      id_estudiante: estudianteData.id_estudiante,
      id_usuario: estudianteData.id_usuario,
      codigo_estudiante: estudianteData.codigo_estudiante,
      carrera: estudianteData.carrera,
      semestre: estudianteData.semestre
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
    if (!formulario.id_usuario || !formulario.codigo_estudiante || !formulario.carrera || !formulario.semestre) {
      mostrarAlerta('advertencia', 'Por favor completa todos los campos');
      return;
    }

    try {
      setCargando(true);
      let response;

      if (modoEdicion) {
        response = await actualizarEstudiante(formulario.id_estudiante, formulario);
      } else {
        response = await crearEstudiante(formulario);
      }

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarEstudiantes();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar el estudiante');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este estudiante? Esta acción también eliminará su usuario asociado.')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarEstudiante(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarEstudiantes();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar el estudiante');
    } finally {
      setCargando(false);
    }
  };

  const estudiantesFiltrados = estudiantes.filter(e =>
    e.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.codigo_estudiante?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.carrera?.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1>Gestión de Estudiantes</h1>
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
                  Nuevo Estudiante
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
                    placeholder="Buscar por nombre, código o carrera..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando estudiantes..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Correo</th>
                        <th>Carrera</th>
                        <th>Semestre</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron estudiantes
                          </td>
                        </tr>
                      ) : (
                        estudiantesFiltrados.map((e) => (
                          <tr key={e.id_estudiante}>
                            <td data-label="Código"><strong>{e.codigo_estudiante}</strong></td>
                            <td data-label="Nombres">{e.nombres}</td>
                            <td data-label="Apellidos">{e.apellidos}</td>
                            <td data-label="Correo">{e.correo}</td>
                            <td data-label="Carrera">{e.carrera}</td>
                            <td data-label="Semestre">{e.semestre}</td>
                            <td data-label="Acciones">
                              <div className="tabla-acciones">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => abrirModalEditar(e)}
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleEliminar(e.id_estudiante)}
                                  title="Eliminar"
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
        titulo={modoEdicion ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        mostrar={modalAbierto}
        onClose={() => setModalAbierto(false)}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          {!modoEdicion && (
            <div className="form-group">
              <label className="form-label">Usuario *</label>
              <select
                name="id_usuario"
                className="form-select"
                value={formulario.id_usuario}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar usuario</option>
                {usuariosDisponibles.map(u => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombres} {u.apellidos} - {u.correo}
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                Solo se muestran usuarios con rol "Estudiante" sin asignar
              </small>
            </div>
          )}

          {modoEdicion && (
            <div className="form-group">
              <label className="form-label">Usuario Asignado</label>
              <input
                type="text"
                className="form-input"
                value={`${estudiantes.find(e => e.id_estudiante === formulario.id_estudiante)?.nombres || ''} ${estudiantes.find(e => e.id_estudiante === formulario.id_estudiante)?.apellidos || ''}`}
                disabled
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Código de Estudiante *</label>
            <input
              type="text"
              name="codigo_estudiante"
              className="form-input"
              value={formulario.codigo_estudiante}
              onChange={handleChange}
              placeholder="Ej: EST-2024-001"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Carrera *</label>
            <select
              name="carrera"
              className="form-select"
              value={formulario.carrera}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar carrera</option>
              {carreras.map((carrera, index) => (
                <option key={index} value={carrera}>{carrera}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Semestre *</label>
            <select
              name="semestre"
              className="form-select"
              value={formulario.semestre}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar semestre</option>
              {semestres.map((semestre, index) => (
                <option key={index} value={semestre}>{semestre}</option>
              ))}
            </select>
          </div>

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
              disabled={cargando}
              style={{ flex: 1 }}
            >
              {cargando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Estudiantes;