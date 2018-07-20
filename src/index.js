import React from 'react';
import Point from './point';
import Bezier from './bezier';
import { calculateCurveControlPoints, throttle, trim } from './util';

class Signature extends React.Component {
  constructor(props) {
    super(props);

    this.style = this.props.style || {};
    this.style.width = this.style.width || '100%';
    this.style.height = this.style.height || '100%';
    this.style.msTouchAction = 'none';
    this.style.touchAction = 'none';
    this.clearVal = 0;

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.strokeBegin = this.strokeBegin.bind(this);
    this.strokeUpdate = this.strokeUpdate.bind(this);
    this.strokeEnd = this.strokeEnd.bind(this);
    this.transformData = this.transformData.bind(this);
    this.createPoint = this.createPoint.bind(this);
    this.addPoint = this.addPoint.bind(this);
    this.calculateCurveWidths = this.calculateCurveWidths.bind(this);
    this.drawPoint = this.drawPoint.bind(this);
    this.drawCurve = this.drawCurve.bind(this);
    this.drawDot = this.drawDot.bind(this);
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    this.fromDataURL = this.fromDataURL.bind(this);
  }

  componentDidMount() {
    // Listen to mouse up events from anywhere (not just the canvas)
    document.addEventListener('mouseup', this.handleMouseUp);

    this.velocityFilterWeight = this.props.velocityFilterWeight || 0.7;
    this.minWidth = this.props.minWidth || 0.5;
    this.maxWidth = this.props.maxWidth || 2.5;
    this.throttle = this.props.throttle || 16; // in miliseconds
    this.strokeMoveUpdate = this.throttle ? throttle(this.strokeUpdate, this.throttle) : this.strokeUpdate;
    this.strokeMoveUpdate = this.strokeUpdate;
    this.dotSize = this.props.dotSize || ((this.minWidth + this.maxWidth) / 2);
    this.penColor = this.props.penColor || 'black';
    this.backgroundColor = this.props.backgroundColor || 'rgba(0,0,0,0)';
    this.mimeType = this.props.mimeType || 'image/png';
    this.blob = this.props.blob || false;
    this.trim = this.props.trim || false;
    this.quality = this.props.quality || 1.0;

    const canvas = this.canvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.ctx = canvas.getContext('2d');
    this.clear();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.clear && nextProps.clear !== this.clearVal) {
      this.clearVal = nextProps.clear;
      this.clear();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  fromDataURL(dataUrl, options = {}, callback = null) {
    this.reset();
    const image = new Image();
    const ratio = options.ratio || window.devicePixelRatio || 1;
    const width = options.width || (this.canvas.width / ratio);
    const height = options.height || (this.canvas.height / ratio);

    image.onload = () => {
      this.ctx.drawImage(image, 0, 0, width, height);
      if (callback) { callback(); }
    };
    image.onerror = (error) => {
      if (callback) { callback(error); }
    };
    image.src = dataUrl;
  }

  handleMouseDown(event) {
    if (event.button === 0) {
      this.mouseButtonDown = true;
      this.strokeBegin(event);
    }
  }

  handleMouseMove(event) {
    if (this.mouseButtonDown) {
      this.strokeMoveUpdate(event);
    }
  }

  handleMouseUp(event) {
    if (event.button === 0 && this.mouseButtonDown) {
      this.mouseButtonDown = false;
      this.strokeEnd(event);
    }
  }

  handleTouchStart(event) {
    if (event.targetTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.strokeBegin(touch);
    }
  }

  handleTouchMove(event) {
    event.preventDefault();
    const touch = event.targetTouches[0];
    this.strokeMoveUpdate(touch);
  }

  handleTouchEnd(event) {
    const wasCanvasTouched = event.target === this.canvas;
    if (wasCanvasTouched) {
      event.preventDefault();
      this.strokeEnd(event);
    }
  }

  strokeBegin(event) {
    this.data.push([]);
    this.reset();
    this.strokeUpdate(event);

    if (typeof this.props.onBegin === 'function') {
      this.props.onBegin(event);
    }
  }

  strokeUpdate(event) {
    const x = event.clientX;
    const y = event.clientY;

    const point = this.createPoint(x, y);
    const { curve, widths } = this.addPoint(point);

    if (curve && widths) {
      this.drawCurve(curve, widths.start, widths.end);
    }

    this.data[this.data.length - 1].push({
      x: point.x,
      y: point.y,
      time: point.time
    });
  }

  strokeEnd() {
    const canDrawCurve = this.points.length > 2;
    const point = this.points[0];

    if (!canDrawCurve && point) {
      this.drawDot(point);
    }

    if (typeof this.props.onEnd === 'function') {
      this.props.onEnd(this.transformData());
    }
  }

  transformData() {
    let type = String(this.mimeType).toLowerCase();
    let data;
    let canvas;
    if (this.trim) {
      canvas = trim(this.canvas);
    } else {
      canvas = this.canvas;
    }
    if (type === 'image/jpeg' || 'image/png') {
      data = canvas.toDataURL(type, this.quality);
    } else {
      type = 'image/png';
      data = canvas.toDataURL(type, this.quality);
    }
    if (this.blob) {
      // Not using toBlob since it's not supported by some browsers
      const byteString = atob(data.split(',')[1]);
      const mimeString = data.split(',')[0].split(':')[1].split(';')[0];
      const array = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i += 1) {
        array[i] = byteString.charCodeAt(i);
      }
      data = new Blob([array], { type: mimeString });
    }
    return data;
  }

  createPoint(x, y, time) {
    const rect = this.canvas.getBoundingClientRect();

    return new Point(
      x - rect.left,
      y - rect.top,
      time || new Date().getTime()
    );
  }

  addPoint(point) {
    const points = this.points;
    let tmp;
    points.push(point);
    if (points.length > 2) {
      // To reduce the initial lag make it work with 3 points
      // by copying the first point to the beginning.
      if (points.length === 3) points.unshift(points[0]);
      tmp = calculateCurveControlPoints(points[0], points[1], points[2]);
      const c2 = tmp.c2;
      tmp = calculateCurveControlPoints(points[1], points[2], points[3]);
      const c3 = tmp.c1;
      const curve = new Bezier(points[1], c2, c3, points[2]);
      const widths = this.calculateCurveWidths(curve);
      // Remove the first element from the list,
      // so that we always have no more than 4 points in points array.
      points.shift();
      return { curve, widths };
    }
    return {};
  }

  calculateCurveWidths(curve) {
    const startPoint = curve.startPoint;
    const endPoint = curve.endPoint;
    const widths = { start: null, end: null };

    const velocity = (this.velocityFilterWeight * endPoint.velocityFrom(startPoint))
      + ((1 - this.velocityFilterWeight) * this.lastVelocity);

    const newWidth = this.strokeWidth(velocity);

    widths.start = this.lastWidth;
    widths.end = newWidth;

    this.lastVelocity = velocity;
    this.lastWidth = newWidth;

    return widths;
  }

  strokeWidth(velocity) {
    return Math.max(this.maxWidth / (velocity + 1), this.minWidth);
  }

  drawPoint(x, y, size) {
    this.ctx.moveTo(x, y);
    this.ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    if (typeof this.props.onChange === 'function') {
      this.props.onChange(false);
    }
  }

  drawCurve(curve, startWidth, endWidth) {
    const widthDelta = endWidth - startWidth;
    const drawSteps = Math.floor(curve.length());

    this.ctx.beginPath();

    for (let i = 0; i < drawSteps; i += 1) {
      // Calculate the Bezier (x, y) coordinate for this step.
      const t = i / drawSteps;
      const tt = t * t;
      const ttt = tt * t;
      const u = 1 - t;
      const uu = u * u;
      const uuu = uu * u;

      let x = uuu * curve.startPoint.x;
      x += 3 * uu * t * curve.control1.x;
      x += 3 * u * tt * curve.control2.x;
      x += ttt * curve.endPoint.x;

      let y = uuu * curve.startPoint.y;
      y += 3 * uu * t * curve.control1.y;
      y += 3 * u * tt * curve.control2.y;
      y += ttt * curve.endPoint.y;

      const width = startWidth + (ttt * widthDelta);
      this.drawPoint(x, y, width);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  drawDot(point) {
    this.ctx.beginPath();
    this.drawPoint(point.x, point.y, this.dotSize);
    this.ctx.closePath();
    this.ctx.fill();
  }

  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.data = [];
    this.reset();
    if (typeof this.props.onChange === 'function') {
      this.props.onChange(true);
    }
  }

  reset() {
    this.points = [];
    this.lastVelocity = 0;
    this.lastWidth = (this.minWidth + this.maxWidth) / 2;
    this.ctx.fillStyle = this.penColor;
  }

  render() {
    return (
      <canvas
        style={this.style}
        className={this.props.className}
        ref={(canvas) => { this.canvas = canvas; }}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
      />
    );
  }

}

export default Signature;
