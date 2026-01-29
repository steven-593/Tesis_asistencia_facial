import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BookOpen, 
  Calendar,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Camera // Icono para la cámara (opcional, si decides añadir el escáner aquí)
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'; // Asegúrate de importar lo necesario de recharts
import Cargando from '../comunes/Cargando';
import { obtenerMaterias } from '../../api/materiasApi';
import { obtenerAsistenciasHoy, obtenerAsistenciasMes } from '../../api/estadisticasApi';
import '../../estilos/dashboard.css';

const DashboardDocente = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [materias, setMaterias] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [estadisticasMes, setEstadisticasMes] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [materiasRes, asistenciasHoyRes, estadisticasMesRes] = await Promise.all([
        obtenerMaterias(),
        obtenerAsistenciasHoy(),
        obtenerAsistenciasMes()
      ]);

      if (materiasRes.exito) {
        setMaterias(materiasRes.datos || []);
      }

      if (asistenciasHoyRes.exito) {
        setAsistenciasHoy(asistenciasHoyRes.datos || []);
      }

      if (estadisticasMesRes.exito) {
        setEstadisticasMes(estadisticasMesRes.datos);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // --- MENÚ LATERAL (SIDEBAR) ---
  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Tomar Asistencia', icono: ClipboardList, ruta: '/docente/asistencias' }, // Esta ruta debe coincidir con App.jsx
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/docente/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/docente/horarios' },
  ];

  // Datos para gráfico de pastel
  const datosGraficoPastel = estadisticasMes ? [
    { name: 'Presentes', value: parseInt(estadisticasMes.presentes || 0), color: '#10b981' },
    { name: 'Ausentes', value: parseInt(estadisticasMes.ausentes || 0), color: '#ef4444' }
  ] : [];

  // Obtener día actual
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaActual = diasSemana[new Date().getDay()];

  // Filtrar materias de hoy
  const materiasHoy = materias.filter(m => m.dia === diaActual);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>DOCENTE</h2>
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
          <h1>Panel del Docente</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="bienvenida">
            <h2>Bienvenido, {usuario?.nombres}!</h2>
            <p>Gestiona las asistencias de tus materias</p>
          </div>

          {cargando ? (
            <Cargando mensaje="Cargando información..." />
          ) : (
            <>
              {/* Estadísticas */}
              <div className="estadisticas-grid">
                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#dbeafe' }}>
                    <BookOpen size={32} color="#3b82f6" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Materias Totales</p>
                    <h3 className="estadistica-valor">{materias.length}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#d1fae5' }}>
                    <ClipboardList size={32} color="#10b981" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Asistencias Hoy</p>
                    <h3 className="estadistica-valor">{asistenciasHoy.length}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#fef3c7' }}>
                    <Calendar size={32} color="#f59e0b" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Clases Hoy</p>
                    <h3 className="estadistica-valor">{materiasHoy.length}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#e0e7ff' }}>
                    <TrendingUp size={32} color="#6366f1" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Asistencia Mes</p>
                    <h3 className="estadistica-valor">
                      {estadisticasMes?.porcentaje ? `${parseFloat(estadisticasMes.porcentaje).toFixed(1)}%` : '0%'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="chart-grid">
                {/* Gráfico de pastel - Asistencias del mes */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      Asistencias del Mes Actual
                    </h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {estadisticasMes && estadisticasMes.total > 0 ? (
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datosGraficoPastel}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {datosGraficoPastel.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No hay asistencias registradas este mes
                      </p>
                    )}
                  </div>
                </div>

                {/* Métricas del mes */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Resumen del Mes</h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px'
                    }}>
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#d1fae5',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.9rem', color: '#065f46', marginBottom: '8px' }}>
                          Presentes
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46', margin: 0 }}>
                          {estadisticasMes?.presentes || 0}
                        </h3>
                      </div>

                      <div style={{
                        padding: '20px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <XCircle size={32} color="#ef4444" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '8px' }}>
                          Ausentes
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
                          {estadisticasMes?.ausentes || 0}
                        </h3>
                      </div>

                      <div style={{
                        padding: '20px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '8px',
                        textAlign: 'center',
                        gridColumn: '1 / -1'
                      }}>
                        <Users size={32} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '8px' }}>
                          Total Registros
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
                          {estadisticasMes?.total || 0}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clases de hoy */}
              <div className="card mt-16">
                <div className="card-header">
                  <h3 className="card-title">
                    <Calendar size={20} style={{ marginRight: '8px' }} />
                    Mis Clases de Hoy ({diaActual})
                  </h3>
                </div>
                <div style={{ padding: '20px' }}>
                  {materiasHoy.length > 0 ? (
                    <div className="clases-grid">
                      {materiasHoy.map((materia) => (
                        <div
                          key={materia.id_materia}
                          style={{
                            padding: '20px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            transition: 'all 0.2s'
                          }}
                        >
                          <h4 style={{ marginTop: 0, color: '#1e293b' }}>{materia.nombre_materia}</h4>
                          <p style={{ color: '#64748b', margin: '8px 0', fontSize: '0.9rem' }}>
                            {materia.carrera}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px'
                          }}>
                            <Clock size={16} color="#64748b" />
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                              {materia.hora_inicio} - {materia.hora_fin}
                            </span>
                          </div>
                          {/* Botón en la tarjeta de clase */}
                          <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '12px' }}
                            onClick={() => navigate('/docente/asistencias')}
                          >
                            Tomar Asistencia
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No tienes clases programadas para hoy
                    </p>
                  )}
                </div>
              </div>

              {/* Últimas asistencias registradas */}
              <div className="card mt-16">
                <div className="card-header">
                  <h3 className="card-title">
                    <Clock size={20} style={{ marginRight: '8px' }} />
                    Últimas Asistencias Registradas Hoy
                  </h3>
                </div>
                <div style={{ padding: '20px' }}>
                  {asistenciasHoy.length > 0 ? (
                    <div className="tabla-contenedor">
                      <table className="tabla">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Estudiante</th>
                            <th>Materia</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asistenciasHoy.slice(0, 5).map((asistencia) => (
                            <tr key={asistencia.id_asistencia}>
                              <td data-label="Hora">{asistencia.hora}</td>
                              <td data-label="Estudiante">{asistencia.nombre_estudiante}</td>
                              <td data-label="Materia">{asistencia.nombre_materia}</td>
                              <td data-label="Estado">
                                <span style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  backgroundColor: asistencia.estado === 'Presente' ? '#d1fae5' : '#fee2e2',
                                  color: asistencia.estado === 'Presente' ? '#065f46' : '#991b1b'
                                }}>
                                  {asistencia.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No hay asistencias registradas hoy
                    </p>
                  )}
                </div>
              </div>

              {/* Accesos rápidos - AQUI AGREGAMOS EL BOTON */}
              <div className="card mt-16">
                <div className="card-header">
                  <h3 className="card-title">Accesos Rápidos</h3>
                </div>
                <div className="accesos-rapidos">
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/docente/asistencias')}
                  >
                    <ClipboardList size={24} />
                    <span>Tomar Asistencia</span>
                  </button>
                  
                  {/* Puedes agregar aquí el botón del Escáner si ya creaste el componente */}
                  {/* <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/docente/escaner')}
                  >
                    <Camera size={24} />
                    <span>Escáner Facial</span>
                  </button> */}

                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/docente/materias')}
                  >
                    <BookOpen size={24} />
                    <span>Ver Mis Materias</span>
                  </button>
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/docente/horarios')}
                  >
                    <Calendar size={24} />
                    <span>Ver Horarios</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardDocente;