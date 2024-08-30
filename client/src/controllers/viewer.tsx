import { useEffect, useState } from 'react';
import PanelGroup from '../views/PanelGroup';
import { useAuth } from '@models/authContext/authContext';

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
    <div
      style={{ padding: '10px', backgroundColor: 'midnightblue', height: '100vh', width: '100%' }}
    >
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button onClick={logout}>Cerrar sesión</button>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '2px',
            marginLeft: '2px',
            marginRight: '2px',
          }}
        >
          <span style={{ color: 'white' }}>Columnas:</span>
          <button
            onClick={() => {
              setColumns(columns - 1);
            }}
          >
            -
          </button>
          <input
            type="number"
            value={columns}
            onChange={(e) => {
              setColumns(parseInt(e.target.value, 10));
            }}
            style={{ width: '40px' }}
          />
          <button
            onClick={() => {
              setColumns(columns + 1);
            }}
          >
            +
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            padding: '2px',
            marginLeft: '2px',
            marginRight: '2px',
          }}
        >
          <span style={{ color: 'white' }}>Filas:</span>
          <button
            onClick={() => {
              setRows(rows - 1);
            }}
          >
            -
          </button>
          <input
            type="number"
            value={rows}
            onChange={(e) => {
              setRows(parseInt(e.target.value, 10));
            }}
            style={{ width: '40px' }}
          />
          <button
            onClick={() => {
              setRows(rows + 1);
            }}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ height: '100vh', width: '100%' }}>
        <PanelGroup columns={columns} rows={rows} />
      </div>
    </div>
  );
};

export default Viewer;
