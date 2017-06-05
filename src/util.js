import Point from './point';

// http://stackoverflow.com/a/27078401/815507
export function throttle(func, wait, options, ...all) {
  let context;
  let args;
  let result;
  let timeout = null;
  let previous = 0;
  const opts = options || {};
  const later = () => {
    previous = opts.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) {
      args = null;
      context = args;
    }
  };
  return function call() {
    const now = Date.now();
    if (!previous && opts.leading === false) previous = now;
    const remaining = wait - (now - previous);
    context = this;
    args = all;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) {
        args = null;
        context = args;
      }
    } else if (!timeout && opts.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}

// https://gist.github.com/remy/784508

export function trim(canvas) {
  const ctx = canvas.getContext('2d');
  const copy = document.createElement('canvas').getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const length = pixels.data.length;
  const bound = {
    top: null,
    left: null,
    right: null,
    bottom: null
  };
  for (let i = 0; i < length; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);

      if (bound.top === null) {
        bound.top = y;
      }

      if (bound.left === null) {
        bound.left = x;
      } else if (x < bound.left) {
        bound.left = x;
      }

      if (bound.right === null) {
        bound.right = x;
      } else if (bound.right < x) {
        bound.right = x;
      }

      if (bound.bottom === null) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }

  const trimHeight = bound.bottom - bound.top;
  const trimWidth = bound.right - bound.left;
  const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

  copy.canvas.width = trimWidth;
  copy.canvas.height = trimHeight;
  copy.putImageData(trimmed, 0, 0);
  return copy.canvas;
}

export function calculateCurveControlPoints(s1, s2, s3) {
  const dx1 = s1.x - s2.x;
  const dy1 = s1.y - s2.y;
  const dx2 = s2.x - s3.x;
  const dy2 = s2.y - s3.y;

  const m1 = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0 };
  const m2 = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0 };

  const l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));
  const l2 = Math.sqrt((dx2 * dx2) + (dy2 * dy2));

  const dxm = (m1.x - m2.x);
  const dym = (m1.y - m2.y);

  const k = l2 / (l1 + l2);
  const cm = { x: m2.x + (dxm * k), y: m2.y + (dym * k) };

  const tx = s2.x - cm.x;
  const ty = s2.y - cm.y;

  return {
    c1: new Point(m1.x + tx, m1.y + ty),
    c2: new Point(m2.x + tx, m2.y + ty)
  };
}