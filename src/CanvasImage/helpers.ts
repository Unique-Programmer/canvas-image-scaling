import { DOCUMENT_VIEW_EDGES } from './constants';

export type PointType = {
  x: number;
  y: number;
};

export type ImageDimension = {
  width: number;
  height: number;
};

export const readImageFile = (file: File, isBlobResponse = false): Promise<Blob | string | null | undefined> => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async event => {
      if (isBlobResponse && event.target?.result) {
        return resolve(new Blob([event.target.result], { type: file.type }));
      }

      if (event.target?.result instanceof ArrayBuffer) {
        return resolve(Buffer.from(event.target.result).toString());
      }

      return resolve(event.target?.result);
    };

    reader.onerror = event => {
      return reject(event);
    };

    if (isBlobResponse) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
};

export const getImageSize = (imageData?: Blob | string | null): Promise<ImageDimension> | undefined => {
  if (!imageData) {
    return undefined;
  }

  return new Promise((resolve): void => {
    const image = new Image();

    image.onload = () => {
      const { width, height } = image;

      const imageSize: ImageDimension = {
        width,
        height,
      };

      resolve(imageSize);
    };

    if (typeof imageData === 'string') {
      image.src = imageData;
    } else if (imageData instanceof Blob) {
      image.src = (window.URL || window.webkitURL).createObjectURL(imageData);
    }
  });
};

export const getCanvasSize = () => {
  const imageSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  const canvasScale = canvasHeight / imageSize.height;

  return {
    canvasWidth,
    canvasHeight,
    canvasScale,
  };
};

export const getPinchLength = ([touch1, touch2]: TouchList) =>
  Math.sqrt(Math.pow(touch1.clientY - touch2.clientY, 2) + Math.pow(touch1.clientX - touch2.clientX, 2));

export const getRelativePosition = ({ clientX, clientY }: any, relativeToElement: any) => {
  const rect = relativeToElement.getBoundingClientRect();

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

export const tryCancelEvent = (event: TouchEvent) => {
  if (event.cancelable === false) {
    return false;
  }

  if (event.defaultPrevented) event.preventDefault();

  return true;
};

export const isImageBlob = (imageData: Blob | string | null | undefined): imageData is Blob =>
  imageData instanceof Blob;

export const getImageScale = ({ imageWidth, imageHeight, windowWidth, windowHeight }: any) => {
  const imageAspectRatio = imageWidth / imageHeight;
  const windowAspectRatio = windowWidth / windowHeight;

  // Считаем scale по высоте
  if (windowAspectRatio > imageAspectRatio) {
    return windowHeight / (imageHeight + DOCUMENT_VIEW_EDGES * 2);
  }

  // Считаем scale по ширине
  return windowWidth / (imageWidth + DOCUMENT_VIEW_EDGES * 2);
};

export const fixPoint = (point: PointType, canvas: HTMLCanvasElement | null): PointType => {
  const box = canvas?.getBoundingClientRect();

  if (canvas && box) {
    return {
      x: point.x - box.left - (box.width - canvas.width) / 2,
      y: point.y - box.top - (box.height - canvas.height) / 2,
    };
  }

  return { x: 0, y: 0 };
};

export const isEqual = (p1: PointType, p2: PointType) => p1.x === p2.x && p1.y === p2.y;

export const getDistance = (p1: Touch, p2: Touch) => {
  return Math.hypot(p1.pageX - p2.pageX, p1.pageY - p2.pageY);
};

export const clampNum = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
