import { useEffect, useRef } from 'react';
import {
  ImageDimension,
  PointType,
  getCanvasSize,
  getImageSize,
  fixPoint,
  getImageScale,
  getDistance,
} from './helpers';
import { MIN_ZOOM, MAX_ZOOM, MOVE_SENSITIVITY, SCALE_STEP, ZERO_POINT } from './constants';

const setGSTPreventDefault = (e: any) => {
  e.preventDefault();
  e.stopImmediatePropagation();
};

type CanvasImageProps = {
  imageData?: Blob | null;
  onMoveEnd?: () => void;
  onZoomEnd?: () => void;
};

export const useCanvasImage = ({ imageData, onMoveEnd, onZoomEnd }: CanvasImageProps) => {
  const scale = useRef(1);
  const animation = useRef(0);
  const positionDX = useRef(0);
  const positionDY = useRef(0);
  const touchDistance = useRef(0);

  const isDrawn = useRef(false);
  const touched = useRef(false);
  const dragging = useRef(false);
  const initialized = useRef(false);
  const eventsInited = useRef(false);

  const imageInstance = useRef<HTMLImageElement | null>(null);

  const startXY = useRef<PointType>(ZERO_POINT);
  const moveXY = useRef<PointType>(ZERO_POINT);

  const imageSize = useRef<ImageDimension>({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);

  const { canvasWidth, canvasHeight, canvasScale } = getCanvasSize();

  const resetState = () => {
    console.log('%c resetState', 'color: white; background-color: #26bfa5;');

    scale.current = 0;
    animation.current = 0;
    positionDX.current = 0;
    positionDY.current = 0;

    touched.current = false;
    dragging.current = false;
    isDrawn.current = false;
    initialized.current = false;
    startXY.current = ZERO_POINT;
    moveXY.current = ZERO_POINT;
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  };

  const drawImage = () => {
    const canvas = canvasRef.current;

    if (!canvas || !imageInstance.current) {
      return null;
    }

    if (context.current && (!isDrawn.current || dragging.current)) {
      const { width: imageWidth, height: imageHeight } = imageSize.current;

      // Координаты левого верхнего угла img на канвасе
      let sx = positionDX.current;
      let sy = positionDY.current;

      // Размеры изображения с учетом scale
      const scaledWidth = imageWidth * scale.current;
      const scaledHeight = imageHeight * scale.current;

      if (!isDrawn.current) {
        initialized.current = true;
        console.log('%c first Draw', 'color: white; background-color: #ab26bf;');

        sx = (canvasWidth - scaledWidth) / 2;
        sy = (canvasHeight - scaledHeight) / 2;
      }

      context.current.clearRect(0, 0, canvas.width, canvas.height);
      context.current.drawImage(
        imageInstance.current,
        0,
        0,
        imageWidth,
        imageHeight,
        sx,
        sy,
        scaledWidth,
        scaledHeight,
      );

      isDrawn.current = true;
    }

    animation.current = requestAnimationFrame(drawImage);
  };

  const fixScale = () => {
    if (scale.current <= MIN_ZOOM) {
      scale.current = MIN_ZOOM;
    }

    if (scale.current >= MAX_ZOOM) {
      scale.current = MAX_ZOOM;
    }
  };

  const touchStart = (event: TouchEvent) => {
    event.preventDefault();

    // Перемещение изображения
    if (event.touches.length === 1) {
      dragging.current = true;
      startXY.current = fixPoint({ x: event.touches[0].clientX, y: event.touches[0].clientY }, canvasRef.current);

      if (!touched.current) {
        touched.current = true;

        const scaledWidth = imageSize.current.width * scale.current;
        const scaledHeight = imageSize.current.height * scale.current;

        const sx = (canvasWidth - scaledWidth) / 2;
        const sy = (canvasHeight - scaledHeight) / 2;

        positionDX.current = sx;
        positionDY.current = sy;
      }
    }

    // Увеличение изображения
    if (event.touches.length === 2) {
      touchDistance.current = getDistance(event.touches[0], event.touches[1]);
    }
  };

  const moveTouch = (event: TouchEvent) => {
    event.preventDefault();

    if (!dragging.current || !event.touches) {
      return false;
    }

    const { clientX, clientY } = event.touches[0];

    if (event.touches.length === 1) {
      moveXY.current = fixPoint({ x: clientX, y: clientY }, canvasRef.current);

      positionDX.current += (moveXY.current.x - startXY.current.x) * MOVE_SENSITIVITY;
      positionDY.current += (moveXY.current.y - startXY.current.y) * MOVE_SENSITIVITY;

      startXY.current = { ...moveXY.current };
    }

    // Увеличение изображения
    if (event.touches.length === 2 && event.changedTouches.length === 2) {
      console.log('%c Увеличение', 'color: white; background-color: #26bfa5;');

      const pos = fixPoint({ x: clientX, y: clientY }, canvasRef.current);

      const newPos = {
        x: Number((pos.x - positionDX.current) / scale.current),
        y: Number((pos.y - positionDY.current) / scale.current),
      };

      const deltaDistance = getDistance(event.touches[0], event.touches[1]);

      // Увеличение
      if (touchDistance.current > deltaDistance) {
        scale.current -= SCALE_STEP;
      }

      // Уменьшение
      if (touchDistance.current < deltaDistance) {
        scale.current += SCALE_STEP;
      }

      fixScale();

      // Рассчитываем положение используя текущий масштаб
      positionDX.current = (1 - scale.current) * newPos.x + (pos.x - newPos.x);
      positionDY.current = (1 - scale.current) * newPos.y + (pos.y - newPos.y);

      touchDistance.current = getDistance(event.touches[0], event.touches[1]);
    }
  };

  const endTouch = (event: TouchEvent) => {
    event.preventDefault();

    dragging.current = false;

    startXY.current = ZERO_POINT;
    moveXY.current = ZERO_POINT;

    if (event.touches.length === 1) {
      onMoveEnd?.();
    }

    if (event.touches.length === 2) {
      onZoomEnd?.();
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
  }, []);

  const initRedrawing = () => {
    cancelAnimationFrame(animation.current);
    animation.current = requestAnimationFrame(drawImage);
    console.log('%c initRedrawing', 'color: white; background-color: #bf2673;');
  };

  const removeEvents = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      return;
    }

    console.log('%c removeEvents', 'color: white; background-color: #bf262b;');

    document.removeEventListener('gesturestart', setGSTPreventDefault);

    canvas?.removeEventListener('touchstart', touchStart);
    canvas?.removeEventListener('touchmove', moveTouch);
    canvas?.removeEventListener('touchend', endTouch);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    const initEvents = () => {
      removeEvents(canvas);

      if (!eventsInited.current) {
        eventsInited.current = true;

        console.log('%c initEvents', 'color: #ff2626; background-color: #2cf300;');

        // Отключение zoom прикосновениями (в том числе трекападами и т.п.) в Safari и iOS
        document.addEventListener('gesturestart', setGSTPreventDefault, { passive: false });

        canvas?.addEventListener('touchstart', touchStart, { passive: false });
        canvas?.addEventListener('touchmove', moveTouch, { passive: false });
        canvas?.addEventListener('touchend', endTouch, { passive: false });
      }
    };

    const initImageSize = () => {
      if (!(imageData instanceof Blob)) {
        return;
      }

      console.log('%c initImageSize', 'color: white; background-color: #78bf26;');

      imageInstance.current = new Image();

      imageInstance.current.onload = async () => {
        const size = await getImageSize(imageData);

        if (size) {
          resetState();

          imageSize.current = size;

          scale.current = getImageScale({
            imageWidth: size.width,
            imageHeight: size.height,
            windowWidth: canvasWidth,
            windowHeight: canvasHeight,
          });

          initCanvas();
          initEvents();
          initRedrawing();
        }
      };

      imageInstance.current.src = (window.URL || window.webkitURL).createObjectURL(imageData);
    };

    initImageSize();
  }, [imageData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const rafId = animation.current;
    const canvas = canvasRef.current;

    return () => {
      console.log('%c rafId', 'color: white; background-color: #26bfa5;', rafId);

      if (rafId) {
        console.log('%c cancelAnimationFrame', 'color: white; background-color: #bf2638');
        cancelAnimationFrame(rafId);
      }

      if (eventsInited.current) {
        console.log('%c removeEventListener', 'color: white; background-color: #bf262b;');
        removeEvents(canvas);
      }
    };
  }, []);

  return {
    canvasRef,
    containerRef,
    canvasScale,
  };
};
