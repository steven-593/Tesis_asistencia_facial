import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Clock
} from 'lucide-react';
import Modal from '../comunes/Modal';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import {
  obtenerHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario
} from '../../api/horariosApi';
import '../../estilos/dashboard.css';

const Horarios = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Formulario
  const [formulario, setFormulario] = useState({
    id_horario: '',
    dia: '',
    hora_inicio: '',
    hora_fin: ''
  });

  const diasSemana = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];

  useEffect(() => {
    cargarHorarios();
  }, []);

  const cargarHorarios = async () => {
    try {
      setCargando(true);
      const response = await obtenerHorarios();
      if (response.exito) {
        setHorarios(response.datos || []);
      } else {
        mostrarAlerta('error', response.mensaje || 'Error al cargar horarios');
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
      id_horario: '',
      dia: '',
      hora_inicio: '',
      hora_fin: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (horarioData) => {
    setModoEdicion(true);
    setFormulario({
      id_horario: horarioData.id_horario,
      dia: horarioData.dia,
      hora_inicio: horarioData.hora_inicio,
      hora_fin: horarioData.hora_fin
    });
    setModalAbierto(true);
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const validarHorario = () => {
    if (!formulario.dia || !formulario.hora_inicio || !formulario.hora_fin) {
      mostrarAlerta('advertencia', 'Por favor completa todos los campos');
      return false;
    }

    // Validar que la hora de fin sea mayor a la hora de inicio
    if (formulario.hora_inicio >= formulario.hora_fin) {
      mostrarAlerta('advertencia', 'La hora de fin debe ser mayor a la hora de inicio');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarHorario()) {
      return;
    }

    try {
      setCargando(true);
      let response;

      if (modoEdicion) {
        response = await actualizarHorario(formulario.id_horario, formulario);
      } else {
        response = await crearHorario(formulario);
      }

      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        setModalAbierto(false);
        cargarHorarios();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al guardar el horario');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este horario? Esto podría afectar las materias asociadas.')) {
      return;
    }

    try {
      setCargando(true);
      const response = await eliminarHorario(id);
      if (response.exito) {
        mostrarAlerta('exito', response.mensaje);
        cargarHorarios();
      } else {
        mostrarAlerta('error', response.mensaje);
      }
    } catch (error) {
      mostrarAlerta('error', 'Error al eliminar el horario');
    } finally {
      setCargando(false);
    }
  };

  const horariosFiltrados = horarios.filter(h =>
    h.dia?.toLowerCase().includes(busqueda.toLowerCase()) ||
    h.hora_inicio?.includes(busqueda) ||
    h.hora_fin?.includes(busqueda)
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
          <h1>Gestión de Horarios</h1>
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
                  Nuevo Horario
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
                    placeholder="Buscar por día u hora..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                  />
                </div>
              </div>

              {cargando ? (
                <Cargando mensaje="Cargando horarios..." />
              ) : (
                <div className="tabla-contenedor">
                  <table className="tabla">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Día</th>
                        <th>Hora Inicio</th>
                        <th>Hora Fin</th>
                        <th>Duración</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                            No se encontraron horarios
                          </td>
                        </tr>
                      ) : (
                        horariosFiltrados.map((h) => {
                          const inicio = h.hora_inicio.split(':');
                          const fin = h.hora_fin.split(':');
                          const duracionMinutos = (parseInt(fin[0]) * 60 + parseInt(fin[1])) - (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
                          const horas = Math.floor(duracionMinutos / 60);
                          const minutos = duracionMinutos % 60;
                          const duracion = `${horas}h ${minutos > 0 ? minutos + 'm' : ''}`;

                          return (
                            <tr key={h.id_horario}>
                              <td data-label="ID">{h.id_horario}</td>
                              <td data-label="Día">
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af'
                                }}>
                                  {h.dia}
                                </span>
                              </td>
                              <td data-label="Hora Inicio">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={16} color="#64748b" />
                                  {h.hora_inicio}
                                </div>
                              </td>
                              <td data-label="Hora Fin">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={16} color="#64748b" />
                                  {h.hora_fin}
                                </div>
                              </td>
                              <td data-label="Duración">{duracion}</td>
                              <td data-label="Acciones">
                                <div className="tabla-acciones">
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => abrirModalEditar(h)}
                                    title="Editar"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleEliminar(h.id_horario)}
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
        titulo={modoEdicion ? 'Editar Horario' : 'Nuevo Horario'}
        mostrar={modalAbierto}
        onClose={() => setModalAbierto(false)}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Día de la Semana *</label>
            <select
              name="dia"
              className="form-select"
              value={formulario.dia}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar día</option>
              {diasSemana.map((dia, index) => (
                <option key={index} value={dia}>{dia}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Hora de Inicio *</label>
            <input
              type="time"
              name="hora_inicio"
              className="form-input"
              value={formulario.hora_inicio}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hora de Fin *</label>
            <input
              type="time"
              name="hora_fin"
              className="form-input"
              value={formulario.hora_fin}
              onChange={handleChange}
              required
            />
          </div>

          {formulario.hora_inicio && formulario.hora_fin && formulario.hora_inicio < formulario.hora_fin && (
            <div style={{
              padding: '12px',
              backgroundColor: '#dbeafe',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#1e40af', margin: 0 }}>
                <strong>Duración de la clase:</strong> {(() => {
                  const inicio = formulario.hora_inicio.split(':');
                  const fin = formulario.hora_fin.split(':');
                  const duracionMinutos = (parseInt(fin[0]) * 60 + parseInt(fin[1])) - (parseInt(inicio[0]) * 60 + parseInt(inicio[1]));
                  const horas = Math.floor(duracionMinutos / 60);
                  const minutos = duracionMinutos % 60;
                  return `${horas} hora${horas !== 1 ? 's' : ''} ${minutos > 0 ? `y ${minutos} minuto${minutos !== 1 ? 's' : ''}` : ''}`;
                })()}
              </p>
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

export default Horarios;