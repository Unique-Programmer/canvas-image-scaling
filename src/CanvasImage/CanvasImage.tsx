import styled, { css } from 'styled-components';

import { useCanvasImage } from './useCanvasImage';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
`;

const Canvas = styled.canvas<{ $scale?: number }>`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  box-sizing: border-box;
  touch-action: none; /* Отключаем браузерные жесты, чтобы иметь полный контроль над событиями Touch */

  ${({ $scale }) =>
    $scale &&
    css`
      transform: scale(${$scale}) translate(-${100 - $scale * 100}%, -${100 - $scale * 100}%);
      transform-origin: 50% 50%;
    `}
`;

type CanvasImageProps = {
  imageData?: Blob;
  onMoveEnd?: () => void;
  onZoomEnd?: () => void;
};

export const CanvasImage = ({ imageData, onMoveEnd, onZoomEnd }: CanvasImageProps) => {
  const { canvasRef, containerRef, canvasScale } = useCanvasImage({ imageData, onMoveEnd, onZoomEnd });

  return (
    <Container ref={containerRef}>
      <Canvas ref={canvasRef} $scale={canvasScale} />
    </Container>
  );
};
