import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/**
 * Gráfico de Barras - Asistencias vs Ausencias
 */
export const GraficoAsistenciasVsAusencias = ({ presentes, ausentes }) => {
  const datos = [
    { nombre: 'Presente', valor: presentes, fill: '#10b981' },
    { nombre: 'Ausente', valor: ausentes, fill: '#ef4444' }
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="nombre" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Bar dataKey="valor" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de Pastel - Distribución de Asistencias
 */
export const GraficoDistribucionAsistencias = ({ presentes, ausentes }) => {
  const datos = [
    { name: 'Presente', value: presentes },
    { name: 'Ausente', value: ausentes }
  ];

  const COLORES = ['#10b981', '#ef4444'];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => 
              `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {datos.map((entrada, index) => (
              <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de Barras - Asistencias por Día (últimas 7 días)
 */
export const GraficoAsistenciasPorDia = ({ datos }) => {
  const datosFormateados = datos.map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    }),
    Presentes: parseInt(item.presentes) || 0,
    Ausentes: parseInt(item.ausentes) || 0
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosFormateados}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="fecha" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Legend />
          <Bar dataKey="Presentes" fill="#10b981" />
          <Bar dataKey="Ausentes" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Indicador de Porcentaje - Visualización tipo gauge
 */
export const IndicadorPorcentaje = ({ porcentaje, tamaño = 'medio' }) => {
  let tamanoCirculo = 120;
  let tamanoTexto = 32;

  if (tamaño === 'grande') {
    tamanoCirculo = 160;
    tamanoTexto = 48;
  } else if (tamaño === 'pequeño') {
    tamanoCirculo = 80;
    tamanoTexto = 24;
  }

  // Determinar color según porcentaje
  let color = '#ef4444'; // Rojo por defecto
  if (porcentaje >= 80) color = '#10b981'; // Verde
  else if (porcentaje >= 60) color = '#f59e0b'; // Naranja

  // Asegurar que porcentaje sea un número válido entre 0 y 100
  const porcentajeValido = Math.min(Math.max(parseFloat(porcentaje) || 0, 0), 100);
  
  const circumferencia = 2 * Math.PI * (tamanoCirculo / 2 - 10);
  const offset = circumferencia - (porcentajeValido / 100) * circumferencia;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: tamanoCirculo, height: tamanoCirculo }}>
        <svg width={tamanoCirculo} height={tamanoCirculo} style={{ transform: 'rotate(-90deg)' }}>
          {/* Círculo de fondo */}
          <circle
            cx={tamanoCirculo / 2}
            cy={tamanoCirculo / 2}
            r={tamanoCirculo / 2 - 10}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Círculo de progreso */}
          <circle
            cx={tamanoCirculo / 2}
            cy={tamanoCirculo / 2}
            r={tamanoCirculo / 2 - 10}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumferencia}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Texto central */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: `${tamanoTexto}px`, fontWeight: 'bold', color }}>
            {porcentajeValido.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Asistencia</div>
        </div>
      </div>
    </div>
  );
};