/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import Select from 'react-select';
import cornerstone from 'cornerstone-core';
import dicomParser from 'dicom-parser';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import DropInput from '../components/DropInput';
import Panel from './Panel';
import axios from 'axios';

interface PanelGroupProps {
  columns: number;
  rows: number;
}

const PanelGroup: React.FC<PanelGroupProps> = ({ columns, rows }) => {
  useEffect(() => {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
  }, []);

  const [selectedImageSets, setSelectedImageSets] = React.useState<number[]>(Array(columns * rows).fill(null));
  const [imgSets, setImgSets] = React.useState<string[][]>([]);
  const [imgs, setImgs] = React.useState<
    Record<number, { imageId: string; instanceNumber: number; patientName: string; seriesDescription: string; modality: string; studyDate: string }[]>
  >({});

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [selectedStudyDate, setSelectedStudyDate] = useState<string | null>(null);

  const filterOptions = useMemo(() => {
    const uniqueOptions = {
      patients: new Set<string>(),
      series: new Set<string>(),
      modalities: new Set<string>(),
      dates: new Set<string>()
    };

    Object.values(imgs).forEach(imageSet => {
      imageSet.forEach(img => {
        uniqueOptions.patients.add(img.patientName);
        uniqueOptions.series.add(img.seriesDescription);
        uniqueOptions.modalities.add(img.modality);
        uniqueOptions.dates.add(img.studyDate);
      });
    });

    return {
      patients: Array.from(uniqueOptions.patients).map(value => ({ value, label: value })),
      series: Array.from(uniqueOptions.series).map(value => ({ value, label: value })),
      modalities: Array.from(uniqueOptions.modalities).map(value => ({ value, label: value })),
      dates: Array.from(uniqueOptions.dates).map(value => ({ value, label: value }))
    };
  }, [imgs]);

  const getFilteredOptions = useCallback(() => {
    return Object.keys(imgSets)
      .filter((key) => imgs[parseInt(key, 10)]?.length > 0)
      .filter((key) => {
        const imageSet = imgs[parseInt(key, 10)];
        return imageSet.some(img => 
          (!selectedPatient || img.patientName === selectedPatient) &&
          (!selectedSeries || img.seriesDescription === selectedSeries) &&
          (!selectedModality || img.modality === selectedModality) &&
          (!selectedStudyDate || img.studyDate === selectedStudyDate)
        );
      })
      .flatMap((key) =>
        imgs[parseInt(key, 10)].map((img) => ({
          value: parseInt(key, 10),
          label: `Paciente: ${img.patientName}, Serie: ${img.seriesDescription}, Modalidad: ${img.modality}, Fecha: ${img.studyDate}`,
        }))
      );
  }, [imgs, imgSets, selectedPatient, selectedSeries, selectedModality, selectedStudyDate]);

  const handleFileChange = async (files: FileList) => {
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));

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

        console.log("Imágenes actualizadas:", updatedImgs);
        return updatedImgs;
      });

      setSelectedImageSets(prev => {
        const newSelectedImageSets = [...prev];
        // Encuentra el primer panel sin un set de imágenes asignado
        const firstEmptyPanelIndex = newSelectedImageSets.findIndex(set => set === null);
        if (firstEmptyPanelIndex !== -1) {
          newSelectedImageSets[firstEmptyPanelIndex] = imgSet;
        }
        return newSelectedImageSets;
      });

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

  const clearFilters = useCallback(() => {
    setSelectedPatient(null);
    setSelectedSeries(null);
    setSelectedModality(null);
    setSelectedStudyDate(null);
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && void handleFileChange(e.target.files)}
        />
        <Select
          placeholder="Filtrar por paciente"
          value={selectedPatient ? { value: selectedPatient, label: selectedPatient } : null}
          options={filterOptions.patients}
          onChange={(option) => setSelectedPatient(option?.value ?? null)}
          isClearable
        />
        <Select
          placeholder="Filtrar por serie"
          value={selectedSeries ? { value: selectedSeries, label: selectedSeries } : null}
          options={filterOptions.series}
          onChange={(option) => setSelectedSeries(option?.value ?? null)}
          isClearable
        />
        <Select
          placeholder="Filtrar por modalidad"
          value={selectedModality ? { value: selectedModality, label: selectedModality } : null}
          options={filterOptions.modalities}
          onChange={(option) => setSelectedModality(option?.value ?? null)}
          isClearable
        />
        <Select
          placeholder="Filtrar por fecha"
          value={selectedStudyDate ? { value: selectedStudyDate, label: selectedStudyDate } : null}
          options={filterOptions.dates}
          onChange={(option) => setSelectedStudyDate(option?.value ?? null)}
          isClearable
        />
        <button 
          onClick={clearFilters}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Limpiar Filtros
        </button>
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
        <div style={{ display: 'grid', width: '100%', height: '100%', backgroundColor: 'black', gridTemplateColumns: `repeat(${columns.toString()}, 1fr)`, gridTemplateRows: `repeat(${rows.toString()}, 1fr)` }}>
          {Array.from({ length: columns * rows }).map((_, i) => (
            <div key={i} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Select
                value={selectedImageSets[i] ? { value: selectedImageSets[i], label: selectedImageSets[i].toString() } : null}
                styles={{ container: (provided) => ({ ...provided, width: '100%', margin: 0, padding: 0 }) }}
                options={getFilteredOptions()}
                onChange={(selected) => {
                  setSelectedImageSets((prev) => {
                    const newSelectedSets = [...prev];
                    newSelectedSets[i] = selected?.value ?? null;
                    return newSelectedSets;
                  });
                }}
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.value}
              />
              <Panel
                key={i}
                imageIds={selectedImageSets[i] ? imgs[selectedImageSets[i]].map((img) => img.imageId) : []}
                style={{ width: '100%', height: '100%', backgroundColor: 'darkgray', borderWidth: '1px', borderStyle: 'solid', borderRadius: '5px' }}
              />
            </div>
          ))}
        </div>
      </DropInput>
    </div>
  );
};

export default PanelGroup;