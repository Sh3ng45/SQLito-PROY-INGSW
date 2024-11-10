import cornerstone from 'cornerstone-core';
import { useWindowSize } from '../hooks/useWindowSize';
import { useEffect, useState, forwardRef, useRef, useImperativeHandle, useCallback } from 'react';

interface PanelProps {
  imageIds: string[];
  style?: React.CSSProperties;
}

interface DicomHeaderInfo {
  pacienteNombre: string;
  medicoNombre: string;
  hospitalEstudio: string;
  fechaEstudio: string;
  modalidad: string;
  numeroInstancia: string;
  orientacionImagen: string;
}

function formatDicomDate(dicomDate: string): string {
  const year = dicomDate.substring(0, 4);
  const month = dicomDate.substring(4, 6);
  const day = dicomDate.substring(6, 8);
  return `${day}/${month}/${year}`;
}

function getImageOrientation(dicomOrientation: string): string {
  const values = dicomOrientation.split('\\').map(parseFloat);
  const xDirection = [values[0], values[1], values[2]];
  const yDirection = [values[3], values[4], values[5]];

  if (
    xDirection[0] === 1 && xDirection[1] === 0 && xDirection[2] === 0 &&
    yDirection[0] === 0 && yDirection[1] === 1 && yDirection[2] === 0
  ) {
    return "Axial";
  }

  if (
    xDirection[0] === 1 && xDirection[1] === 0 && xDirection[2] === 0 &&
    (yDirection[0] === 0 && yDirection[1] === 0 && Math.abs(yDirection[2]) === 1)
  ) {
    return "Coronal";
  }

  if (
    xDirection[0] === 0 && xDirection[1] === 1 && xDirection[2] === 0 &&
    (yDirection[0] === 0 && yDirection[1] === 0 && Math.abs(yDirection[2]) === 1)
  ) {
    return "Sagital";
  }

  return "Orientación desconocida";
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { imageIds, style = {} },
  outerRef,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(outerRef, () => panelRef.current!, [panelRef]);

  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [dicomHeaderInfo, setDicomHeaderInfo] = useState<DicomHeaderInfo | null>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  useEffect(() => {
    if (currentImageIndex >= imageIds.length) {
      setCurrentImageIndex(imageIds.length - 1);
    } else if (currentImageIndex < 0) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, imageIds.length]);

  const extractDicomHeaderInfo = (image: any): DicomHeaderInfo => {
    const { data } = image;
    return {
      pacienteNombre: data.string('x00100010') || 'N/A',
      medicoNombre: data.string('x00080090') || data.string('x00081050') || data.string('x00081060') || data.string('x00081090') || 'N/A',
      hospitalEstudio: data.string('x00080080') || 'N/A',
      fechaEstudio: data.string('x00080020') || 'N/A',
      modalidad: data.string('x00080060') || 'N/A',
      numeroInstancia: data.string('x00200013') || 'N/A',
      orientacionImagen: data.string('x00200037') || 'N/A',
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
    event.stopPropagation();
    if (event.deltaY > 0) {
      setCurrentImageIndex((prev) => Math.min(prev + 1, imageIds.length - 1));
    } else {
      setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  }, [imageIds.length]);

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
    <div style={{ ...style, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div ref={panelRef} style={{ flex: 1 }} />
      {dicomHeaderInfo && (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
          <div>Paciente: {dicomHeaderInfo.pacienteNombre}</div>
          <div>Médico: {dicomHeaderInfo.medicoNombre}</div>
          <div>Hospital: {dicomHeaderInfo.hospitalEstudio}</div>
          <div>Fecha: {formatDicomDate(dicomHeaderInfo.fechaEstudio)}</div>
          <div>Modalidad: {dicomHeaderInfo.modalidad}</div>
          <div>Orientación: {getImageOrientation(dicomHeaderInfo.orientacionImagen)}</div>
          <div>Instancia: {dicomHeaderInfo.numeroInstancia}</div>
        </div>
      )}
    </div>
  );
});

export default Panel;
