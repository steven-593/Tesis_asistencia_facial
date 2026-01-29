import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import Modal from '../comunes/Modal';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import {
  obtenerMaterias,
  crearMateria,
  actualizarMateria,
  eliminarMateria
} from '../../api/materiasApi';
import { obtenerHorarios } from '../../api/horariosApi';
import { obtenerDocentes } from '../../api/docentesApi';
import '../../estilos/dashboard.css';

const Materias = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [materias, setMaterias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_materia: '',
    nombre_materia: '',
    carrera: '',
    id_horario: '',
    id_docente: ''
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await Promise.all([cargarMaterias(), cargarHorarios(), cargarDocentes()]);
    } finally {
      setCargando(false);
    }
  };

  const cargarMaterias = async () => {
    try {
      const response = await obtenerMaterias();
      if (response.exito) {
        setMaterias(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar materias');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al conectar con el servidor');
    }
  };

  const cargarHorarios = async () => {
    try {
      const response = await obtenerHorarios();
      if (response.exito) {
        setHorarios(response.datos || []);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };

  const cargarDocentes = async () => {
    try {
      const response = await obtenerDocentes();
      if (response.exito) {
        setDocentes(response.datos || []);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    }
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ mostrar: true, tipo, mensaje });
    setTimeout(() => {
      setAlerta({ mostrar: false, tipo: '', mensaje: '' });
    }, 4000);
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormulario({
      id_materia: '',
      nombre_materia: '',
      carrera: '',
      id_horario: '',
      id_docente: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (materiaData) => {
    setModoEdicion(true);
    setFormulario({
      id_materia: materiaData.id_materia,
      nombre_materia: materiaData.nombre_materia,
      carrera: materiaData.carrera,
      id_horario: materiaData.id_horario,
      id_docente: materiaData.id_docente || ''
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

    if (!formulario.nombre_materia || !formulario.carrera || !formulario.id_horario) {
      mostrarAlerta('advertencia', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setCargando(true);
      let response;

      if (modoEdicion) {
        response = await actualizarMateria(formulario.id_materia, formulario);
      } else {
        response = await crearMateria(formulario);
      }

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarMaterias();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar la materia');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta materia? Esto podría afectar las matrículas asociadas.')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarMateria(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarMaterias();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar la materia');
    } finally {
      setCargando(false);
    }
  };

  const materiasFiltradas = materias.filter(m =>
    m.nombre_materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.carrera?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.dia?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.nombre_docente?.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1>Gestión de Materias</h1>
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
                  Nueva Materia
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
                    placeholder="Buscar por nombre, carrera, docente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando materias..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre de Materia</th>
                        <th>Docente</th>
                        <th>Carrera</th>
                        <th>Horario</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron materias
                          </td>
                        </tr>
                      ) : (
                        materiasFiltradas.map((m) => (
                          <tr key={m.id_materia}>
                            <td data-label="ID">{m.id_materia}</td>
                            <td data-label="Nombre de Materia"><strong>{m.nombre_materia}</strong></td>
                            <td data-label="Docente">
                              {m.nombre_docente && m.nombre_docente !== 'Sin asignar' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <User size={14} color="#64748b" />
                                  <span>{m.nombre_docente}</span>
                                </div>
                              ) : (
                                <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Sin asignar</span>
                              )}
                            </td>
                            <td data-label="Carrera">{m.carrera}</td>
                            <td data-label="Horario">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Calendar size={14} color="#64748b" />
                                  <span style={{ fontSize: '0.9rem' }}>{m.dia}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={14} color="#64748b" />
                                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    {m.hora_inicio} - {m.hora_fin}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td data-label="Acciones">
                              <div className="tabla-acciones">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => abrirModalEditar(m)}
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleEliminar(m.id_materia)}
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
        titulo={modoEdicion ? 'Editar Materia' : 'Nueva Materia'}
        mostrar={modalAbierto}
        onClose={() => setModalAbierto(false)}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la Materia *</label>
            <input
              type="text"
              name="nombre_materia"
              className="form-input"
              value={formulario.nombre_materia}
              onChange={handleChange}
              placeholder="Ej: Programación Orientada a Objetos"
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
            <label className="form-label">Horario *</label>
            <select
              name="id_horario"
              className="form-select"
              value={formulario.id_horario}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar horario</option>
              {horarios.map(h => (
                <option key={h.id_horario} value={h.id_horario}>
                  {h.dia} - {h.hora_inicio} a {h.hora_fin}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Docente (Opcional)</label>
            <select
              name="id_docente"
              className="form-select"
              value={formulario.id_docente}
              onChange={handleChange}
            >
              <option value="">Seleccionar docente</option>
              {docentes.map(doc => (
                <option key={doc.id_docente} value={doc.id_docente}>
                  {doc.nombres} {doc.apellidos} - {doc.especialidad || 'Sin especialidad'}
                </option>
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
              disabled={cargando || horarios.length === 0}
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

export default Materias;