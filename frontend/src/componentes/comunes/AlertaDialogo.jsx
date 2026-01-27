import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const AlertaDialogo = ({ tipo = 'info', mensaje, onClose, mostrar }) => {
  if (!mostrar) return null;

  const iconos = {
    exito: <CheckCircle size={24} />,
    error: <XCircle size={24} />,
    advertencia: <AlertCircle size={24} />,
    info: <Info size={24} />,
  };

  const clases = {
    exito: 'alerta-exito',
    error: 'alerta-error',
    advertencia: 'alerta-advertencia',
    info: 'alerta-info',
  };

  return (
    <div className={`alerta ${clases[tipo]}`}>
      <div className="alerta-icono">
        {iconos[tipo]}
      </div>
      <div className="alerta-mensaje">
        {mensaje}
      </div>
      {onClose && (
        <button className="alerta-cerrar" onClick={onClose}>
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default AlertaDialogo;