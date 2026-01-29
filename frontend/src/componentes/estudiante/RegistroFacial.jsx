import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Save, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registrarRostro } from '../../api/rostrosApi';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import '../../estilos/dashboard.css';

const RegistroFacial = () => {
  const navigate = useNavigate();
  const videoRef = useRef();
  
  // Estados
  const [modelosCargados, setModelosCargados] = useState(false);
  const [imagenCapturada, setImagenCapturada] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });
  const [stream, setStream] = useState(null);

  // 1. Cargar Modelos de Face API al iniciar
  useEffect(() => {
    const cargarModelos = async () => {
      try {
        const MODEL_URL = '/models'; // Asegúrate de que esta carpeta exista en public/
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        setModelosCargados(true);
        iniciarVideo();
      } catch (error) {
        console.error("Error cargando modelos:", error);
        setAlerta({ 
          mostrar: true, 
          tipo: 'error', 
          mensaje: 'Error al cargar la IA. Verifica que la carpeta /public/models tenga los archivos necesarios.' 
        });
      }
    };
    cargarModelos();

    // Limpieza al salir: Apagar cámara
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Iniciar Webcam
  const iniciarVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((currentStream) => {
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error("Error accediendo a la cámara:", err);
        setAlerta({ mostrar: true, tipo: 'error', mensaje: 'No se puede acceder a la cámara. Revisa los permisos.' });
      });
  };

  // 3. Capturar y Detectar Rostro
  const capturarRostro = async () => {
    if (!videoRef.current) return;

    setCargando(true);

    try {
      // A) Dibujar el frame actual del video en un canvas invisible
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imagenBase64 = canvas.toDataURL('image/jpeg');

      // B) DETECCIÓN DE ROSTRO CON FACE-API
      // Usamos ssdMobilenetv1 que es más preciso para el registro
      const deteccion = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!deteccion) {
        setAlerta({ 
          mostrar: true, 
          tipo: 'advertencia', 
          mensaje: 'No se detectó ningún rostro. Asegúrate de tener buena iluminación y mirar a la cámara.' 
        });
        setCargando(false);
        return;
      }

      // C) Rostro detectado con éxito
      setImagenCapturada(imagenBase64);
      setDescriptor(Array.from(deteccion.descriptor)); // Convertimos Float32Array a Array normal para enviarlo
      setAlerta({ mostrar: true, tipo: 'exito', mensaje: 'Rostro detectado correctamente. Revisa la foto y guarda.' });
    
    } catch (error) {
      console.error(error);
      setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Error al procesar la imagen.' });
    } finally {
      setCargando(false);
    }
  };

  // 4. Resetear para tomar otra foto
  const intentarDeNuevo = () => {
    setImagenCapturada(null);
    setDescriptor(null);
    iniciarVideo(); // Reiniciamos el video si se pausó (aunque aquí solo ocultamos el img)
  };

  // 5. Guardar en Servidor
  const guardarRegistro = async () => {
    if (!descriptor || !imagenCapturada) return;

    setCargando(true);
    try {
      const datos = {
        image: imagenCapturada,
        descriptor: descriptor
      };
      
      const response = await registrarRostro(datos);
      
      if (response.exito) {
        setAlerta({ mostrar: true, tipo: 'exito', mensaje: '¡Registro facial completado exitosamente!' });
        // Redirigir después de 2 segundos
        setTimeout(() => navigate('/estudiante/asistencias'), 2000);
      } else {
        setAlerta({ mostrar: true, tipo: 'error', mensaje: response.mensaje });
      }
    } catch (error) {
      setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Error al conectar con el servidor' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main" style={{ marginLeft: 0, width: '100%', padding: '20px' }}>
        
        {alerta.mostrar && (
          <AlertaDialogo 
            {...alerta} 
            onClose={() => setAlerta({ ...alerta, mostrar: false })} 
          />
        )}

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-header flex-between">
            <h3>Registro de Rostro</h3>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={20} /> Volver
            </button>
          </div>

          <div style={{ padding: '20px', textAlign: 'center' }}>
            {/* Instrucciones */}
            {!imagenCapturada && (
              <div style={{ marginBottom: '20px', color: '#64748b', fontSize: '0.9rem', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <p><strong>Instrucciones:</strong></p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0' }}>
                  <li>☀️ Ubícate en un lugar con buena iluminación.</li>
                  <li>😐 Mantén una expresión neutral y mira directo a la cámara.</li>
                  <li>🧢 Retira gorras, gafas oscuras o mascarillas.</li>
                </ul>
              </div>
            )}

            {!modelosCargados ? (
              <Cargando mensaje="Cargando Inteligencia Artificial..." />
            ) : (
              <>
                {/* Área de Visualización (Video o Foto) */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  maxWidth: '480px', 
                  minHeight: '360px', 
                  margin: '0 auto',
                  backgroundColor: '#000', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  {imagenCapturada ? (
                    <img 
                      src={imagenCapturada} 
                      alt="Captura" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} // Efecto espejo
                    />
                  )}
                  
                  {/* Overlay de guía visual */}
                  {!imagenCapturada && (
                     <div style={{
                       position: 'absolute',
                       top: '50%',
                       left: '50%',
                       transform: 'translate(-50%, -50%)',
                       width: '200px',
                       height: '250px',
                       border: '2px dashed rgba(255,255,255,0.5)',
                       borderRadius: '50%',
                       pointerEvents: 'none'
                     }}></div>
                  )}
                </div>

                {/* Botonera */}
                <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  {!imagenCapturada ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={capturarRostro}
                      disabled={cargando}
                      style={{ padding: '12px 24px', fontSize: '1rem' }}
                    >
                      {cargando ? 'Analizando...' : (
                        <>
                          <Camera size={20} style={{ marginRight: '8px' }} />
                          Capturar Rostro
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        onClick={intentarDeNuevo}
                        disabled={cargando}
                      >
                        <RefreshCw size={20} style={{ marginRight: '8px' }} />
                        Intentar de nuevo
                      </button>
                      
                      <button 
                        className="btn btn-success" 
                        onClick={guardarRegistro} 
                        disabled={cargando}
                      >
                        {cargando ? 'Guardando...' : (
                          <>
                            <Save size={20} style={{ marginRight: '8px' }} />
                            Guardar Registro
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroFacial;