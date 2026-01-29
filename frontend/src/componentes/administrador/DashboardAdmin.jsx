import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  UserCog, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  FileText, // Importado una sola vez correctamente
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Cargando from '../comunes/Cargando';
import { obtenerEstadisticasGenerales, obtenerAsistenciasHoy } from '../../api/estadisticasApi';
import '../../estilos/dashboard.css';

const DashboardAdmin = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [statsResponse, asistenciasResponse] = await Promise.all([
        obtenerEstadisticasGenerales(),
        obtenerAsistenciasHoy()
      ]);

      if (statsResponse.exito) {
        setEstadisticas(statsResponse.datos);
      }

      if (asistenciasResponse.exito) {
        setAsistenciasHoy(asistenciasResponse.datos);
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

  // Menú lateral actualizado con Reportes
  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'usuarios', nombre: 'Usuarios', icono: Users, ruta: '/admin/usuarios' },
    { id: 'estudiantes', nombre: 'Estudiantes', icono: GraduationCap, ruta: '/admin/estudiantes' },
    { id: 'docentes', nombre: 'Docentes', icono: UserCog, ruta: '/admin/docentes' },
    { id: 'horarios', nombre: 'Horarios', icono: Calendar, ruta: '/admin/horarios' },
    { id: 'materias', nombre: 'Materias', icono: BookOpen, ruta: '/admin/materias' },
    { id: 'matriculas', nombre: 'Matrículas', icono: ClipboardList, ruta: '/admin/matriculas' },
    { id: 'reportes', nombre: 'Reportes', icono: FileText, ruta: '/admin/reportes' },
  ];

  // Datos para el gráfico de líneas
  const datosGraficoLineas = estadisticas?.asistencias_por_dia?.map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    Presentes: parseInt(item.presentes),
    Ausentes: parseInt(item.ausentes),
    Total: parseInt(item.total)
  })) || [];

  // Datos para el gráfico de pastel
  const datosGraficoPastel = estadisticas ? [
    { name: 'Presentes', value: parseInt(estadisticas.total_presentes || 0), color: '#10b981' },
    { name: 'Ausentes', value: parseInt(estadisticas.total_asistencias || 0) - parseInt(estadisticas.total_presentes || 0), color: '#ef4444' }
  ] : [];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ADMIN</h2>
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
        {/* Header */}
        <header className="dashboard-header">
          <button 
            className="btn-menu-mobile"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <Menu size={24} />
          </button>
          <h1>Panel de Administración</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        {/* Contenido */}
        <main className="dashboard-content">
          <div className="bienvenida">
            <h2>Bienvenido, {usuario?.nombres}!</h2>
            <p>Resumen del sistema de asistencia facial</p>
          </div>

          {cargando ? (
            <Cargando mensaje="Cargando estadísticas..." />
          ) : (
            <>
              {/* Estadísticas principales */}
              <div className="estadisticas-grid">
                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#dbeafe' }}>
                    <GraduationCap size={32} color="#3b82f6" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Total Estudiantes</p>
                    <h3 className="estadistica-valor">{estadisticas?.total_estudiantes || 0}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#d1fae5' }}>
                    <UserCog size={32} color="#10b981" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Total Docentes</p>
                    <h3 className="estadistica-valor">{estadisticas?.total_docentes || 0}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#fef3c7' }}>
                    <BookOpen size={32} color="#f59e0b" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Total Materias</p>
                    <h3 className="estadistica-valor">{estadisticas?.total_materias || 0}</h3>
                  </div>
                </div>

                <div className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: '#fee2e2' }}>
                    <ClipboardList size={32} color="#ef4444" />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">Asistencias Hoy</p>
                    <h3 className="estadistica-valor">{estadisticas?.asistencias_hoy || 0}</h3>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="chart-grid">
                {/* Gráfico de líneas - Tendencia semanal */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <TrendingUp size={20} style={{ marginRight: '8px' }} />
                      Tendencia de Asistencias (Últimos 7 días)
                    </h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {datosGraficoLineas.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={datosGraficoLineas}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fecha" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Presentes" stroke="#10b981" strokeWidth={2} />
                          <Line type="monotone" dataKey="Ausentes" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No hay datos de asistencias aún
                      </p>
                    )}
                  </div>
                </div>

                {/* Gráfico de pastel - Distribución */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      Distribución de Asistencias
                    </h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {estadisticas?.total_asistencias > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={datosGraficoPastel}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
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
                    ) : (
                      <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                        No hay datos de asistencias aún
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Métricas adicionales */}
              <div className="card mt-16">
                <div className="card-header">
                  <h3 className="card-title">Métricas Generales</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
                        Total de Asistencias
                      </p>
                      <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                        {estadisticas?.total_asistencias || 0}
                      </h3>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
                        Porcentaje de Asistencia
                      </p>
                      <h3 style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        color: estadisticas?.porcentaje_asistencia >= 75 ? '#10b981' : '#ef4444',
                        margin: 0 
                      }}>
                        {estadisticas?.porcentaje_asistencia ? parseFloat(estadisticas.porcentaje_asistencia).toFixed(1) : 0}%
                      </h3>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
                        Presentes (Total)
                      </p>
                      <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                        {estadisticas?.total_presentes || 0}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Últimas asistencias */}
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
                            <th>Código</th>
                            <th>Materia</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asistenciasHoy.slice(0, 10).map((asistencia) => (
                            <tr key={asistencia.id_asistencia}>
                              <td data-label="Hora">{asistencia.hora}</td>
                              <td data-label="Estudiante">{asistencia.nombre_estudiante}</td>
                              <td data-label="Código"><strong>{asistencia.codigo_estudiante}</strong></td>
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

              {/* Accesos rápidos - Botones finales */}
              <div className="card mt-16">
                <div className="card-header">
                  <h3 className="card-title">Accesos Rápidos</h3>
                </div>
                <div className="accesos-rapidos">
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/admin/usuarios')}
                  >
                    <Users size={24} />
                    <span>Gestionar Usuarios</span>
                  </button>
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/admin/estudiantes')}
                  >
                    <GraduationCap size={24} />
                    <span>Gestionar Estudiantes</span>
                  </button>
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/admin/materias')}
                  >
                    <BookOpen size={24} />
                    <span>Gestionar Materias</span>
                  </button>
                  
                  {/* BOTÓN DE REPORTES */}
                  <button 
                    className="acceso-rapido"
                    onClick={() => navigate('/admin/reportes')}
                  >
                    <FileText size={24} />
                    <span>Ver Reportes</span>
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

export default DashboardAdmin;