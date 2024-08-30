import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';

interface DropInputProps extends PropsWithChildren {
  onDragOverColor?: string;
  borderColor?: string;
  onDrop: (files: FileList) => void;
  style?: React.CSSProperties;
}

const DropInput: React.FC<DropInputProps> = (props) => {
  const elementRef = useRef<HTMLDivElement>(null);

  const { children, onDrop, onDragOverColor, borderColor: propsBorderColor, style = {} } = props;
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [borderColor, setBorderColor] = useState(propsBorderColor);

  useEffect(() => {
    setBorderColor(isDragOver ? onDragOverColor : propsBorderColor);
  }, [propsBorderColor, onDragOverColor, isDragOver]);

  useEffect(() => {
    setElement(elementRef.current);
  }, [elementRef]);

  useEffect(() => {
    if (element) {
      element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      });

      element.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      });

      element.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (e.dataTransfer?.files) {
          onDrop(e.dataTransfer.files);
        }
      });
    }

    return () => {
      if (element) {
        element.removeEventListener('dragover', () => {});
        element.removeEventListener('dragleave', () => {});
        element.removeEventListener('drop', () => {});
      }
    };
  }, [element, onDrop]);

  return (
    <div
      ref={elementRef}
      style={{ borderWidth: '3px', borderStyle: 'solid', ...style, borderColor }}
    >
      {children}
    </div>
  );
};

export default DropInput;
