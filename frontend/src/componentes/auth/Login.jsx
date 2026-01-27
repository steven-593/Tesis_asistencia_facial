import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import '../../estilos/login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
  });
  
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [errores, setErrores] = useState({});

  const validarCampo = (name, value) => {
    let error = null;
    if (name === 'correo') {
      if (!value) {
        error = 'El correo es obligatorio';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        error = 'Formato de correo inválido';
      } else if (value.length > 255) {
        error = 'El correo no debe exceder los 255 caracteres';
      }
    } else if (name === 'contrasena') {
      if (!value) {
        error = 'La contraseña es obligatoria';
      } else if (value.length < 8) {
        error = `Faltan ${8 - value.length} caracteres`;
      } else if (value.length > 8) {
        error = `Sobran ${value.length - 8} caracteres`;
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para la contraseña, no permitir más de 8 caracteres
    if (name === 'contrasena' && value.length > 8) {
      return;
    }

    setFormData({ ...formData, [name]: value });

    const error = validarCampo(name, value);
    setErrores({ ...errores, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errorCorreo = validarCampo('correo', formData.correo);
    const errorContrasena = validarCampo('contrasena', formData.contrasena);

    if (errorCorreo || errorContrasena || formData.contrasena.length !== 8) {
      setErrores({
        correo: errorCorreo,
        contrasena: errorContrasena || (formData.contrasena.length !== 8 ? 'La contraseña debe tener 8 caracteres' : null),
      });
      return;
    }

    setCargando(true);
    setErrores({});
    setAlerta({ mostrar: false, tipo: '', mensaje: '' });

    const resultado = await login(formData.correo, formData.contrasena);

    setCargando(false);

    if (resultado.exito) {
      setAlerta({
        mostrar: true,
        tipo: 'exito',
        mensaje: 'Inicio de sesión exitoso',
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setAlerta({
        mostrar: true,
        tipo: 'error',
        mensaje: resultado.mensaje || 'Error al iniciar sesión',
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icono">
            <LogIn size={40} />
          </div>
          <h1>Sistema de Asistencia Facial</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        {alerta.mostrar && (
          <AlertaDialogo
            tipo={alerta.tipo}
            mensaje={alerta.mensaje}
            mostrar={alerta.mostrar}
            onClose={() => setAlerta({ ...alerta, mostrar: false })}
          />
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">
              <Mail size={18} /> Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              className={`form-input ${errores.correo ? 'input-invalid' : formData.correo && 'input-valid'}`}
              placeholder="ejemplo@correo.com"
              value={formData.correo}
              onChange={handleChange}
              disabled={cargando}
              maxLength={255}
            />
            {errores.correo && <p className="form-error">{errores.correo}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={18} /> Contraseña
            </label>
            <div className="input-password-wrapper">
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                name="contrasena"
                className={`form-input ${errores.contrasena ? 'input-invalid' : formData.contrasena.length === 8 && 'input-valid'}`}
                placeholder="••••••••"
                value={formData.contrasena}
                onChange={handleChange}
                disabled={cargando}
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
              >
                {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errores.contrasena ? (
              <p className="form-error">{errores.contrasena}</p>
            ) : (
              <p className="input-feedback ok" style={{ color: formData.contrasena.length === 8 ? 'var(--color-success)' : 'var(--color-text-light)'}}>
                Caracteres: {formData.contrasena.length} / 8
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <Cargando mensaje="" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 Sistema de Asistencia Facial</p>
        </div>
      </div>
    </div>
  );
};

export default Login;