import { useEffect, useState } from 'react';
import PanelGroup from '../views/PanelGroup';
import { useAuth } from '@models/authContext/authContext';
import '../styles/viewer_styles.css'; // Importa los estilos específicos del visor

const Viewer = () => {
  const { logout } = useAuth();
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(2);

  useEffect(() => {
    if (columns < 1) {
      setColumns(1);
    }
    if (rows < 1) {
      setRows(1);
    }
  }, [columns, rows]);

  return (
    <div className="viewer-container">
      <div className="viewer-toolbar">
        {/* Controles de filas y columnas alineados a la izquierda */}
        <div className="viewer-controls-container">
          <div className="viewer-controls">
            <span>Columnas:</span>
            <button onClick={() => setColumns(columns - 1)}>-</button>
            <input
              type="number"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value, 10))}
            />
            <button onClick={() => setColumns(columns + 1)}>+</button>
          </div>
          <div className="viewer-controls">
            <span>Filas:</span>
            <button onClick={() => setRows(rows - 1)}>-</button>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value, 10))}
            />
            <button onClick={() => setRows(rows + 1)}>+</button>
          </div>
        </div>
        {/* Botón de cerrar sesión alineado a la derecha */}
        <button className="logout-button" onClick={logout}>Cerrar sesión</button>
      </div>
      <div style={{ height: '100vh', width: '100%' }}>
        <PanelGroup columns={columns} rows={rows} />
      </div>
    </div>
  );
};

export default Viewer;
