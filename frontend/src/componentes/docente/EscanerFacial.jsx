import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { ArrowLeft, Video, UserCheck, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obtenerTodosLosRostros } from '../../api/rostrosApi';
import { registrarAsistencia } from '../../api/asistenciasApi';
import AlertaDialogo from '../comunes/AlertaDialogo';
import Cargando from '../comunes/Cargando';
import '../../estilos/dashboard.css';

const EscanerFacial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef();
  const canvasRef = useRef();
  
  // Retrieve class data passed from TomarAsistencia
  const materiaData = location.state;

  // States
  const [configClase, setConfigClase] = useState(materiaData || null);
  const [inicializando, setInicializando] = useState(true);
  const [matcher, setMatcher] = useState(null);
  const [detectados, setDetectados] = useState([]); // List of students already marked in this session
  const [alerta, setAlerta] = useState({ mostrar: false, tipo: '', mensaje: '' });

  // Initial Validation: Ensure class data exists
  useEffect(() => {
    if (!materiaData) {
      alert("Error: No se seleccionó ninguna materia. Volviendo...");
      navigate('/docente/asistencias');
    }
  }, [materiaData, navigate]);

  // 1. Load Models and Biometric Data
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // Ensure models are in public/models
        const MODEL_URL = '/models'; 
        
        // A) Load AI models
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        // B) Get faces from database
        const response = await obtenerTodosLosRostros();
        
        if (response.exito && response.datos.length > 0) {
          // C) Create the Matcher (The comparison engine)
          const labeledDescriptors = response.datos.map(alumno => {
            // Convert JSON string to Float32Array required by face-api
            const descriptorArray = JSON.parse(alumno.descriptor);
            const descriptorFloat = new Float32Array(descriptorArray);
            
            // Create label with ID and Name for later use
            return new faceapi.LabeledFaceDescriptors(
              JSON.stringify({ id: alumno.id_estudiante, nombre: alumno.nombre_completo }), 
              [descriptorFloat]
            );
          });

          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is tolerance (60%)
          setMatcher(faceMatcher);
          iniciarVideo();
        } else {
          setAlerta({ mostrar: true, tipo: 'advertencia', mensaje: 'No hay estudiantes con rostro registrado en el sistema.' });
          setInicializando(false);
        }

      } catch (error) {
        console.error(error);
        setAlerta({ mostrar: true, tipo: 'error', mensaje: 'Error al cargar el sistema de reconocimiento. Verifica que los modelos existan en public/models' });
        setInicializando(false);
      }
    };

    if (configClase) {
      cargarTodo();
    }
  }, [configClase]);

  // 2. Start Webcam
  const iniciarVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setInicializando(false);
      })
      .catch((err) => {
        console.error(err);
        setAlerta({ mostrar: true, tipo: 'error', mensaje: 'No se puede acceder a la cámara.' });
        setInicializando(false);
      });
  };

  // 3. Continuous Detection Process
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Configure canvas to match video dimensions
    faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });

    // Detection interval (every 100ms)
    setInterval(async () => {
      if (!matcher || video.paused || video.ended) return;

      // Detect all faces in the image
      const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, { width: video.videoWidth, height: video.videoHeight });

      // Clear previous canvas drawing
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      // Compare each detected face
      const results = resizedDetections.map(d => matcher.findBestMatch(d.descriptor));

      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        
        // If result is not "unknown"
        if (result.label !== 'unknown') {
          const alumno = JSON.parse(result.label); // Retrieve ID and Name
          const text = `${alumno.nombre} (${Math.round(result.distance * 100) / 100})`;
          
          // Draw green box
          const drawBox = new faceapi.draw.DrawBox(box, { label: text, boxColor: '#10b981' });
          drawBox.draw(canvas);

          // AUTOMATICALLY RECORD ATTENDANCE
          procesarAsistencia(alumno);
        } else {
          // Draw red box (Unknown)
          const drawBox = new faceapi.draw.DrawBox(box, { label: 'Desconocido', boxColor: '#ef4444' });
          drawBox.draw(canvas);
        }
      });
    }, 100);
  };

  // 4. Logic to record attendance (prevents duplicates in same session)
  const procesarAsistencia = async (alumno) => {
    // If already detected in this session, do nothing to prevent API spam
    setDetectados(prev => {
      if (prev.find(p => p.id === alumno.id)) return prev;

      // If new in this session, call backend
      registrarEnBackend(alumno);
      return [...prev, { id: alumno.id, nombre: alumno.nombre, hora: new Date().toLocaleTimeString() }];
    });
  };

  const registrarEnBackend = async (alumno) => {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      
      const datos = {
        id_estudiante: alumno.id,
        id_materia: configClase.id_materia, // Uses dynamic class ID
        id_horario: configClase.id_horario, // Uses dynamic schedule ID
        fecha: fechaHoy,
        hora: new Date().toTimeString().split(' ')[0],
        estado: 'Presente',
        metodo_registro: 'Reconocimiento Facial'
      };

      await registrarAsistencia(datos);
      // Optional: Play a sound or show a toast here
    } catch (error) {
      console.error("Error marcando asistencia:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-main" style={{ marginLeft: 0, width: '100%' }}>
        
        {alerta.mostrar && (
          <AlertaDialogo {...alerta} onClose={() => setAlerta({ ...alerta, mostrar: false })} />
        )}

        <div className="card" style={{ maxWidth: '1000px', margin: '20px auto' }}>
          <div className="card-header flex-between">
            <div>
              <h3 style={{ margin: 0 }}>📷 Escáner Automático</h3>
              {configClase && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                  Clase: {configClase.nombre_materia}
                </p>
              )}
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/docente/asistencias')}>
              <ArrowLeft size={20} /> Finalizar
            </button>
          </div>

          <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* VIDEO AREA */}
            <div style={{ flex: '2', position: 'relative', minWidth: '300px' }}>
              {inicializando && <Cargando mensaje="Iniciando IA y Cámara..." />}
              
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  onPlay={handleVideoPlay}
                  style={{ width: '100%' }} 
                />
                <canvas 
                  ref={canvasRef} 
                  style={{ position: 'absolute', top: 0, left: 0 }} 
                />
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px', color: '#64748b' }}>
                <Video size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> El sistema escaneará automáticamente.
              </p>
            </div>

            {/* REAL-TIME ATTENDANCE LIST */}
            <div style={{ flex: '1', minWidth: '250px', maxHeight: '500px', overflowY: 'auto' }}>
              <h4 style={{ marginBottom: '15px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                Alumnos Identificados ({detectados.length})
              </h4>
              
              {detectados.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 10px', display: 'block' }} />
                  Esperando alumnos...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {detectados.map((alumno, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px', 
                      backgroundColor: '#d1fae5', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #10b981',
                      animation: 'fadeIn 0.5s'
                    }}>
                      <div style={{ backgroundColor: 'white', padding: '5px', borderRadius: '50%' }}>
                        <UserCheck size={20} color="#10b981" />
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: '#065f46' }}>{alumno.nombre}</strong>
                        <small style={{ color: '#047857' }}>{alumno.hora}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EscanerFacial;