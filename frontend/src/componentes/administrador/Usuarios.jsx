import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import Modal from '../comunes/Modal';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarEstadoUsuario
} from '../../api/usuariosApi';
import '../../estilos/dashboard.css';

const Usuarios = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_usuario: '',
    id_rol: '',
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    estado: 'Activo'
  });

  const roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Docente' },
    { id: 3, nombre: 'Estudiante' }
  ];

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const response = await obtenerUsuarios();
      if (response.exito) {
        setUsuarios(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar usuarios');
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
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
      id_usuario: '',
      id_rol: '',
      nombres: '',
      apellidos: '',
      correo: '',
      contrasena: '',
      estado: 'Activo'
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuarioData) => {
    setModoEdicion(true);
    setFormulario({
      id_usuario: usuarioData.id_usuario,
      id_rol: usuarioData.id_rol,
      nombres: usuarioData.nombres,
      apellidos: usuarioData.apellidos,
      correo: usuarioData.correo,
      contrasena: '',
      estado: usuarioData.estado
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
    if (!formulario.nombres || !formulario.apellidos || !formulario.correo || !formulario.id_rol) {
      mostrarAlerta('advertencia', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!modoEdicion && !formulario.contrasena) {
      mostrarAlerta('advertencia', 'La contraseña es obligatoria');
      return;
    }

    try {
      setCargando(true);
      let response;

      if (modoEdicion) {
        response = await actualizarUsuario(formulario.id_usuario, formulario);
      } else {
        response = await crearUsuario(formulario);
      }

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarUsuarios();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar el usuario');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarUsuario(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarUsuarios();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar el usuario');
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    
    try {
      setCargando(true);
      const response = await cambiarEstadoUsuario(id, nuevoEstado);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarUsuarios();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al cambiar el estado');
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo?.toLowerCase().includes(busqueda.toLowerCase())
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
          <h1>Gestión de Usuarios</h1>
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
                  Nuevo Usuario
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
                    placeholder="Buscar por nombre, apellido o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando usuarios..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron usuarios
                          </td>
                        </tr>
                      ) : (
                        usuariosFiltrados.map((u) => (
                          <tr key={u.id_usuario}>
                            <td data-label="ID">{u.id_usuario}</td>
                            <td data-label="Nombres">{u.nombres}</td>
                            <td data-label="Apellidos">{u.apellidos}</td>
                            <td data-label="Correo">{u.correo}</td>
                            <td data-label="Rol">{u.nombre_rol}</td>
                            <td data-label="Estado">
                              <span
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  backgroundColor: u.estado === 'Activo' ? '#d1fae5' : '#fee2e2',
                                  color: u.estado === 'Activo' ? '#065f46' : '#991b1b'
                                }}
                              >
                                {u.estado}
                              </span>
                            </td>
                            <td data-label="Acciones">
                              <div className="tabla-acciones">
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => abrirModalEditar(u)}
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => handleEliminar(u.id_usuario)}
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
        titulo={modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
        mostrar={modalAbierto}
        onClose={() => setModalAbierto(false)}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombres *</label>
            <input
              type="text"
              name="nombres"
              className="form-input"
              value={formulario.nombres}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Apellidos *</label>
            <input
              type="text"
              name="apellidos"
              className="form-input"
              value={formulario.apellidos}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              name="correo"
              className="form-input"
              value={formulario.correo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol *</label>
            <select
              name="id_rol"
              className="form-select"
              value={formulario.id_rol}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar rol</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña {!modoEdicion && '*'}
              {modoEdicion && ' (Dejar en blanco para no cambiar)'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                name="contrasena"
                className="form-input"
                value={formulario.contrasena}
                onChange={handleChange}
                required={!modoEdicion}
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-light)'
                }}
              >
                {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estado *</label>
            <select
              name="estado"
              className="form-select"
              value={formulario.estado}
              onChange={handleChange}
              required
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
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

export default Usuarios;