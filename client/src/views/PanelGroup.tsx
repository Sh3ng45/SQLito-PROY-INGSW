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
    Record<number, { imageId: string; instanceNumber: number }[]>
  >({});

  const handleFileChange = async (files: FileList) => {
    for (const file of files) {
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
        if (!(imgSet in prev)) {
          return {
            ...prev,
            [imgSet]: [{ imageId, instanceNumber: imgId }],
          };
        } else {
          return {
            ...prev,
            [imgSet]: [...prev[imgSet], { imageId, instanceNumber: imgId }].reduce<
              { imageId: string; instanceNumber: number }[]
            >((acc, cur) => {
              const instances = acc.map((img) => img.instanceNumber);
              if (instances.includes(cur.instanceNumber)) {
                return acc;
              } else {
                return [...acc, cur].sort((a, b) => a.instanceNumber - b.instanceNumber);
              }
            }, []),
          };
        }
      });
      setSelectedImageSet(imgSet);
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
          value={
            selectedImageSet
              ? { value: selectedImageSet, label: selectedImageSet.toString() }
              : null
          }
          styles={{
            container: (provided) => ({
              ...provided,
              width: '80%',
            }),
          }}
          options={Object.keys(imgSets)
            .filter((key) => imgSets[parseInt(key, 10)])
            .map((key) => ({
              value: parseInt(key, 10),
              label: key,
            }))}
          onChange={(selected) => {
            setSelectedImageSet(selected?.value ?? null);
          }}
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
