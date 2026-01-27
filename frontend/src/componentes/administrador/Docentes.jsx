import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  UserCog,
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
  obtenerDocentes,
  crearDocente,
  actualizarDocente,
  eliminarDocente,
  obtenerUsuariosSinAsignar
} from '../../api/docentesApi';
import '../../estilos/dashboard.css';

const Docentes = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [docentes, setDocentes] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_docente: '',
    id_usuario: '',
    especialidad: ''
  });

  const especialidades = [
    'Matemáticas',
    'Física',
    'Química',
    'Biología',
    'Informática',
    'Programación',
    'Bases de Datos',
    'Redes',
    'Ingeniería de Software',
    'Derecho Civil',
    'Derecho Penal',
    'Administración',
    'Contabilidad',
    'Marketing',
    'Finanzas',
    'Anatomía',
    'Farmacología',
    'Psicología Clínica',
    'Psicología Educativa',
    'Arquitectura',
    'Estructuras',
    'Diseño',
    'Otra'
  ];

  useEffect(() => {
    cargarDocentes();
  }, []);

  const cargarDocentes = async () => {
    try {
      setCargando(true);
      const response = await obtenerDocentes();
      if (response.exito) {
        setDocentes(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar docentes');
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
      id_docente: '',
      id_usuario: '',
      especialidad: ''
    });
    await cargarUsuariosDisponibles();
    setModalAbierto(true);
  };

  const abrirModalEditar = (docenteData) => {
    setModoEdicion(true);
    setFormulario({
      id_docente: docenteData.id_docente,
      id_usuario: docenteData.id_usuario,
      especialidad: docenteData.especialidad || ''
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
    if (!formulario.id_usuario) {
      mostrarAlerta('advertencia', 'Por favor selecciona un usuario');
      return;
    }

    try {
      setCargando(true);
      let response;

      if (modoEdicion) {
        response = await actualizarDocente(formulario.id_docente, formulario);
      } else {
        response = await crearDocente(formulario);
      }

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarDocentes();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar el docente');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este docente? Esta acción también eliminará su usuario asociado.')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarDocente(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarDocentes();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar el docente');
    } finally {
      setCargando(false);
    }
  };

  const docentesFiltrados = docentes.filter(d =>
    d.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1>Gestión de Docentes</h1>
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
                  Nuevo Docente
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
                    placeholder="Buscar por nombre, correo o especialidad..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando docentes..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Correo</th>
                        <th>Especialidad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docentesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron docentes
                          </td>
                        </tr>
                      ) : (
                        docentesFiltrados.map((d) => (
                          <tr key={d.id_docente}>
                            <td data-label="ID">{d.id_docente}</td>
                            <td data-label="Nombres">{d.nombres}</td>
                            <td data-label="Apellidos">{d.apellidos}</td>
                            <td data-label="Correo">{d.correo}</td>
                            <td data-label="Especialidad">{d.especialidad || 'No especificada'}</td>
                            <td data-label="Acciones">
                              <div className="tabla-acciones">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => abrirModalEditar(d)}
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleEliminar(d.id_docente)}
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
        titulo={modoEdicion ? 'Editar Docente' : 'Nuevo Docente'}
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
                Solo se muestran usuarios con rol "Docente" sin asignar
              </small>
            </div>
          )}

          {modoEdicion && (
            <div className="form-group">
              <label className="form-label">Usuario Asignado</label>
              <input
                type="text"
                className="form-input"
                value={`${docentes.find(d => d.id_docente === formulario.id_docente)?.nombres || ''} ${docentes.find(d => d.id_docente === formulario.id_docente)?.apellidos || ''}`}
                disabled
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Especialidad</label>
            <select
              name="especialidad"
              className="form-select"
              value={formulario.especialidad}
              onChange={handleChange}
            >
              <option value="">Seleccionar especialidad (opcional)</option>
              {especialidades.map((esp, index) => (
                <option key={index} value={esp}>{esp}</option>
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

export default Docentes;