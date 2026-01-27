import { X } from 'lucide-react';

const Modal = ({ titulo, children, onClose, mostrar, size = 'medium' }) => {
  if (!mostrar) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-contenido modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="btn-cerrar" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;