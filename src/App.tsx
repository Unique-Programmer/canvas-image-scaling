import { useCallback, useEffect, useState } from 'react';

import { CanvasImage } from './CanvasImage/CanvasImage';
import { isImageBlob, readImageFile } from './CanvasImage/helpers';
import './App.css';
import source from './image2.png';

function App() {
  const [imageData, setImageData] = useState<Blob | string | null | undefined>(null);

  const handleChange = useCallback(async (e: any) => {
    const file = e.target.files[0];

    const imageData = await readImageFile(file, true);

    setImageData(imageData);

    e.target.value = '';
  }, []);

  const onMoveEnd = useCallback(() => {
    console.log('%c  CanvasImage.onMoveEnd', 'color: white; background-color: #26bfa5;');
  }, []);

  const onZoomEnd = useCallback(() => {
    console.log('%c  CanvasImage.onZoomEnd', 'color: white; background-color: #26bfa5;');
  }, []);

  useEffect(() => {
    const drawImage = async () => {
      const image = new Image();
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        context?.drawImage(image, 0, 0);

        canvas.toBlob(imageData => {
          setImageData(imageData);
        });
      };

      image.src = source;
    };

    drawImage();
  }, []);

  return (
    <div className="App" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <a
        href="/xxx"
        style={{
          background: 'red',
          color: 'white',
          padding: '5px 5px',
          position: 'absolute',
          top: '5px',
          left: '5px',
          zIndex: 11,
        }}
      >
        unmount
      </a>

      <div
        style={{
          width: '230px',
          overflow: 'hidden',
          position: 'absolute',
          top: '5px',
          right: '5px',
          zIndex: 11,
          border: '2px solid lime',
        }}
      >
        <input type="file" onChange={handleChange} />
      </div>

      {isImageBlob(imageData) && <CanvasImage imageData={imageData} onMoveEnd={onMoveEnd} onZoomEnd={onZoomEnd} />}
    </div>
  );
}

export default App;
