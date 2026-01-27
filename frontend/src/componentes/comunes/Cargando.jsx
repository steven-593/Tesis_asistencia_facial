import { Loader2 } from 'lucide-react';

const Cargando = ({ mensaje = 'Cargando...' }) => {
  return (
    <div className="cargando-contenedor">
      <Loader2 className="icono-cargando" />
      <p>{mensaje}</p>
    </div>
  );
};

export default Cargando;