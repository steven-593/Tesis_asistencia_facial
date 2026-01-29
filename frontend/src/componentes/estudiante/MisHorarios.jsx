import { useState, useEffect } from 'react';
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
  X,
  Clock
} from 'lucide-react';
import Cargando from '../comunes/Cargando';
import { obtenerMaterias } from '../../api/materiasApi';
import '../../estilos/dashboard.css';

const MisHorarios = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const [horarioSemanal, setHorarioSemanal] = useState({});
  const [cargando, setCargando] = useState(true);

  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: LayoutDashboard, ruta: '/dashboard' },
    { id: 'asistencias', nombre: 'Mis Asistencias', icono: ClipboardList, ruta: '/estudiante/asistencias' },
    { id: 'materias', nombre: 'Mis Materias', icono: BookOpen, ruta: '/estudiante/materias' },
    { id: 'horarios', nombre: 'Mis Horarios', icono: Calendar, ruta: '/estudiante/horarios' },
    { id: 'registro-facial', nombre: 'Registro Facial', icono: Camera, ruta: '/estudiante/registro-facial' },
  ];

  const diasOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const response = await obtenerMaterias();
      
      if (response.exito && response.datos) {
        // Agrupar materias por día
        const agrupado = response.datos.reduce((acc, materia) => {
          const dia = materia.dia;
          if (!acc[dia]) acc[dia] = [];
          acc[dia].push(materia);
          return acc;
        }, {});

        // Ordenar por hora
        Object.keys(agrupado).forEach(dia => {
          agrupado[dia].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        });

        setHorarioSemanal(agrupado);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>ESTUDIANTE</h2>
          <button className="btn-cerrar-sidebar" onClick={() => setMenuAbierto(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icono = item.icono;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${item.ruta === '/estudiante/horarios' ? 'activo' : ''}`}
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

      {/* Contenido Principal */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button className="btn-menu-mobile" onClick={() => setMenuAbierto(!menuAbierto)}>
            <Menu size={24} />
          </button>
          <h1>Mi Horario de Clases</h1>
          <div className="usuario-info">
            <span>{usuario?.nombres} {usuario?.apellidos}</span>
            <span className="usuario-rol">{usuario?.nombre_rol}</span>
          </div>
        </header>

        <main className="dashboard-content">
          {cargando ? (
            <Cargando mensaje="Organizando tu horario..." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {diasOrdenados.map(dia => {
                const clasesDelDia = horarioSemanal[dia];
                if (!clasesDelDia) return null;

                return (
                  <div key={dia} className="card">
                    <div className="card-header" style={{ backgroundColor: '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
                      <h3 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={20} />
                        {dia}
                      </h3>
                    </div>
                    <div style={{ padding: '0' }}>
                      {clasesDelDia.map((clase, index) => (
                        <div 
                          key={clase.id_materia} 
                          style={{ 
                            padding: '15px 20px', 
                            borderBottom: index < clasesDelDia.length - 1 ? '1px solid #f1f5f9' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{clase.nombre_materia}</h4>
                            <small style={{ color: '#64748b' }}>Prof. {clase.nombre_docente}</small>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            color: '#0284c7', 
                            fontWeight: '600',
                            backgroundColor: '#e0f2fe',
                            padding: '6px 12px',
                            borderRadius: '20px'
                          }}>
                            <Clock size={16} />
                            <span>{clase.hora_inicio} - {clase.hora_fin}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(horarioSemanal).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No tienes materias inscritas con horario asignado.</p>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MisHorarios;