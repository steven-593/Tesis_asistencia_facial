import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BookOpen, 
  Calendar,
  Camera,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import '../../estilos/dashboard.css';

const DashboardEstudiante = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Mis Asistencias', icono: ClipboardList, ruta: '/estudiante/asistencias' },
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/estudiante/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/estudiante/horarios' },
    { id: 'registro-facial', nombre: 'Registro Facial', icono: Camera, ruta: '/estudiante/registro-facial' },
  ];

  const estadisticas = [
    { titulo: 'Materias Inscritas', valor: '0', icono: BookOpen, color: '#3b82f6' },
    { titulo: 'Asistencias', valor: '0', icono: ClipboardList, color: '#10b981' },
    { titulo: 'Faltas', valor: '0', icono: ClipboardList, color: '#ef4444' },
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ESTUDIANTE</h2>
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
          <h1>Panel del Estudiante</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        {/* Contenido */}
        <main className="dashboard-content">
          <div className="bienvenida">
            <h2>Bienvenido, {usuario?.nombres}!</h2>
            <p>Consulta tus asistencias y horarios</p>
          </div>

          {/* Estadísticas */}
          <div className="estadisticas-grid">
            {estadisticas.map((stat, index) => {
              const Icono = stat.icono;
              return (
                <div key={index} className="estadistica-card">
                  <div className="estadistica-icono" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icono size={32} color={stat.color} />
                  </div>
                  <div className="estadistica-info">
                    <p className="estadistica-titulo">{stat.titulo}</p>
                    <h3 className="estadistica-valor">{stat.valor}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accesos rápidos */}
          <div className="card mt-16">
            <div className="card-header">
              <h3 className="card-title">Accesos Rápidos</h3>
            </div>
            <div className="accesos-rapidos">
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/asistencias')}
              >
                <ClipboardList size={24} />
                <span>Ver Asistencias</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/materias')}
              >
                <BookOpen size={24} />
                <span>Mis Materias</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/horarios')}
              >
                <Calendar size={24} />
                <span>Ver Horarios</span>
              </button>
              <button 
                className="acceso-rapido"
                onClick={() => navigate('/estudiante/registro-facial')}
              >
                <Camera size={24} />
                <span>Registro Facial</span>
              </button>
            </div>
          </div>

          {/* Próximas clases */}
          <div className="card mt-16">
            <div className="card-header">
              <h3 className="card-title">Próximas Clases</h3>
            </div>
            <div className="proximas-clases">
              <p className="text-center" style={{ color: 'var(--color-text-light)', padding: '20px' }}>
                No hay clases programadas para hoy
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardEstudiante;