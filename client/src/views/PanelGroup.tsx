/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { useEffect } from 'react';
import Select from 'react-select';
import cornerstone from 'cornerstone-core';
import dicomParser from 'dicom-parser';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import DropInput from '../components/DropInput';
import Panel from './Panel';
import axios from 'axios'; // Agregamos axios para hacer la solicitud al servidor


interface PanelGroupProps {
  columns: number;
  rows: number;
}

const PanelGroup: React.FC<PanelGroupProps> = ({ columns, rows }) => {
  useEffect(() => {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  }, []);

  const [selectedImageSet, setSelectedImageSet] = React.useState<number | null>(null);
  const [imgSets, setImgSets] = React.useState<string[][]>([]);
  const [imgs, setImgs] = React.useState<
    Record<number, { imageId: string; instanceNumber: number; patientName: string; seriesDescription: string; modality: string; studyDate: string }[]>
  >({});

  const handleFileChange = async (files: FileList) => {
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));

      // Extraer información DICOM
      const patientName = dataSet.string('x00100010') || 'Desconocido';
      const seriesDescription = dataSet.string('x0008103e') || 'No especificado';
      const modality = dataSet.string('x00080060') || 'No especificado';
      const studyDate = dataSet.string('x00080020') || 'Sin fecha';

      const [, imgSet, imgId] = file.name
        .split('.')[0]
        .split('-')
        .map((s) => parseInt(s, 10));

      if (!imgSets[imgSet]) {
        setImgSets((prev) => {
          const newImgSets = [...prev];
          newImgSets[imgSet] = [];
          return newImgSets;
        });
      }

      const imageId: string = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

      setImgs((prev) => {
        const updatedImgs = {
          ...prev,
          [imgSet]: prev[imgSet]
            ? [...prev[imgSet], {
                imageId,
                instanceNumber: imgId,
                patientName,
                seriesDescription,
                modality,
                studyDate,
              }]
            : [{
                imageId,
                instanceNumber: imgId,
                patientName,
                seriesDescription,
                modality,
                studyDate,
              }]
        };

        console.log("Imágenes actualizadas:", updatedImgs); // Log para verificar el contenido cargado
        return updatedImgs;
      });

      setSelectedImageSet(imgSet);

      // Enviar la imagen al servidor
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('http://localhost:3000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Respuesta del servidor:', response.data);
      } catch (error) {
        console.error('Error al enviar la imagen:', error);
      }
    }
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Select
          value={selectedImageSet ? { value: selectedImageSet, label: selectedImageSet.toString() } : null}
          styles={{
            container: (provided) => ({
              ...provided,
              width: '80%',
            }),
          }}
          options={Object.keys(imgSets)
            .filter((key) => imgs[parseInt(key, 10)]?.length > 0)  // Asegurarnos de que haya imágenes cargadas
            .flatMap((key) =>
              imgs[parseInt(key, 10)].map((img) => ({
                value: parseInt(key, 10),
                label: `Paciente: ${img.patientName}, Serie: ${img.seriesDescription}, Modalidad: ${img.modality}, Fecha: ${img.studyDate}`,
              }))
            )}
          onChange={(selected) => {
            setSelectedImageSet(selected?.value ?? null);
          }}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
        />
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && void handleFileChange(e.target.files)}
        />
      </div>
      <DropInput
        key={columns * rows}
        onDrop={(files) => void handleFileChange(files)}
        borderColor="black"
        onDragOverColor="blue"
        style={{
          height: '90%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            display: 'grid',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            gridTemplateColumns: `repeat(${columns.toString()}, 1fr)`,
            gridTemplateRows: `repeat(${rows.toString()}, 1fr)`,
          }}
        >
          {Array.from({ length: columns * rows }).map((_, i) => (
            <Panel
              key={i}
              imageIds={selectedImageSet ? imgs[selectedImageSet].map((img) => img.imageId) : []}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'darkgray',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '5px',
              }}
            />
          ))}
        </div>
      </DropInput>
    </div>
  );
};

export default PanelGroup;
