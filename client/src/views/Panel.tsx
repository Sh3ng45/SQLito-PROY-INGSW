import cornerstone from 'cornerstone-core';
import { useWindowSize } from '../hooks/useWindowSize';
import { useEffect, useState, forwardRef, useRef, useImperativeHandle, useCallback } from 'react';

interface PanelProps {
  imageIds: string[];
  style?: React.CSSProperties;
}

interface DicomHeaderInfo {
  pacienteNombre: string;
  fechaEstudio: string;
  modalidad: string;
  numeroSerie: string;
  numeroInstancia: string;
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { imageIds, style = {} },
  outerRef,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(outerRef, () => panelRef.current!, [panelRef]);

  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [dicomHeaderInfo, setDicomHeaderInfo] = useState<DicomHeaderInfo | null>(null);

  useEffect(() => {
    setPanel(panelRef.current);
  }, [panelRef]);

  useEffect(() => {
    if (panel) {
      console.log('enable');
      cornerstone.enable(panel);
    }
    return () => {
      if (panel) cornerstone.disable(panel);
    };
  }, [panel]);

  const [windowX, windowY] = useWindowSize();

  useEffect(() => {
    if (panel) {
      cornerstone.resize(panel);
    }
  }, [panel, windowX, windowY, panel?.clientWidth, panel?.clientHeight]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (currentImageIndex >= imageIds.length) {
      setCurrentImageIndex(imageIds.length);
    } else if (currentImageIndex < 0) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, imageIds.length]);

  const extractDicomHeaderInfo = (image: any): DicomHeaderInfo => {
    const { data } = image;
    return {
      pacienteNombre: data.string('x00100010') || 'N/A',
      fechaEstudio: data.string('x00080020') || 'N/A',
      modalidad: data.string('x00080060') || 'N/A',
      numeroSerie: data.string('x00200011') || 'N/A',
      numeroInstancia: data.string('x00200013') || 'N/A',
    };
  };

  useEffect(() => {
    void (async () => {
      if (panel && imageIds.length && imageIds[currentImageIndex]) {
        const image = await cornerstone.loadImage(imageIds[currentImageIndex]);
        cornerstone.displayImage(panel, image);
        const headerInfo = extractDicomHeaderInfo(image);
        setDicomHeaderInfo(headerInfo);
      }
    })();
  }, [panel, imageIds, currentImageIndex]);

  const handleScroll = useCallback((event: WheelEvent) => {
    event.preventDefault();
    if (event.deltaY > 0) {
      setCurrentImageIndex((prev) => prev + 1);
    } else {
      setCurrentImageIndex((prev) => prev - 1);
    }
  }, []);

  useEffect(() => {
    if (panel) {
      panel.addEventListener('wheel', handleScroll);
    }
    return () => {
      if (panel) {
        panel.removeEventListener('wheel', handleScroll);
      }
    };
  }, [panel, handleScroll]);

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'column' }}>
      <div ref={panelRef} style={{ flex: 1 }} />
      {dicomHeaderInfo && (
        <div style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          color: 'white', 
          padding: '5px', 
          fontSize: '12px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
          <div>Paciente: {dicomHeaderInfo.pacienteNombre}</div>
          <div>Fecha: {dicomHeaderInfo.fechaEstudio}</div>
          <div>Modalidad: {dicomHeaderInfo.modalidad}</div>
          <div>Series: {dicomHeaderInfo.numeroSerie}</div>
          <div>Instancia: {dicomHeaderInfo.numeroInstancia}</div>
        </div>
      )}
    </div>
  );
});

export default Panel;
