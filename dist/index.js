'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _point = require('./point');

var _point2 = _interopRequireDefault(_point);

var _bezier = require('./bezier');

var _bezier2 = _interopRequireDefault(_bezier);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Signature = function (_React$Component) {
  _inherits(Signature, _React$Component);

  function Signature(props) {
    _classCallCheck(this, Signature);

    var _this = _possibleConstructorReturn(this, (Signature.__proto__ || Object.getPrototypeOf(Signature)).call(this, props));

    _this.style = _this.props.style || {};
    _this.style.width = _this.style.width || '100%';
    _this.style.height = _this.style.height || '100%';
    _this.style.msTouchAction = 'none';
    _this.style.touchAction = 'none';
    _this.clearVal = 0;

    _this.handleMouseDown = _this.handleMouseDown.bind(_this);
    _this.handleMouseMove = _this.handleMouseMove.bind(_this);
    _this.handleMouseUp = _this.handleMouseUp.bind(_this);
    _this.handleTouchStart = _this.handleTouchStart.bind(_this);
    _this.handleTouchMove = _this.handleTouchMove.bind(_this);
    _this.handleTouchEnd = _this.handleTouchEnd.bind(_this);
    _this.strokeBegin = _this.strokeBegin.bind(_this);
    _this.strokeUpdate = _this.strokeUpdate.bind(_this);
    _this.strokeEnd = _this.strokeEnd.bind(_this);
    _this.transformData = _this.transformData.bind(_this);
    _this.createPoint = _this.createPoint.bind(_this);
    _this.addPoint = _this.addPoint.bind(_this);
    _this.calculateCurveWidths = _this.calculateCurveWidths.bind(_this);
    _this.drawPoint = _this.drawPoint.bind(_this);
    _this.drawCurve = _this.drawCurve.bind(_this);
    _this.drawDot = _this.drawDot.bind(_this);
    _this.clear = _this.clear.bind(_this);
    _this.reset = _this.reset.bind(_this);
    _this.fromDataURL = _this.fromDataURL.bind(_this);
    return _this;
  }

  _createClass(Signature, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      // Listen to mouse up events from anywhere (not just the canvas)
      document.addEventListener('mouseup', this.handleMouseUp);

      this.velocityFilterWeight = this.props.velocityFilterWeight || 0.7;
      this.minWidth = this.props.minWidth || 0.5;
      this.maxWidth = this.props.maxWidth || 2.5;
      this.throttle = this.props.throttle || 16; // in miliseconds
      this.strokeMoveUpdate = this.throttle ? (0, _util.throttle)(this.strokeUpdate, this.throttle) : this.strokeUpdate;
      this.strokeMoveUpdate = this.strokeUpdate;
      this.dotSize = this.props.dotSize || (this.minWidth + this.maxWidth) / 2;
      this.penColor = this.props.penColor || 'black';
      this.backgroundColor = this.props.backgroundColor || 'rgba(0,0,0,0)';
      this.mimeType = this.props.mimeType || 'image/png';
      this.blob = this.props.blob || false;
      this.trim = this.props.trim || false;
      this.quality = this.props.quality || 1.0;

      var canvas = this.canvas;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this.ctx = canvas.getContext('2d');
      this.clear();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.clear && nextProps.clear !== this.clearVal) {
        this.clearVal = nextProps.clear;
        this.clear();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
  }, {
    key: 'fromDataURL',
    value: function fromDataURL(dataUrl) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      this.reset();
      var image = new Image();
      var ratio = options.ratio || window.devicePixelRatio || 1;
      var width = options.width || this.canvas.width / ratio;
      var height = options.height || this.canvas.height / ratio;

      image.onload = function () {
        _this2.ctx.drawImage(image, 0, 0, width, height);
        if (callback) {
          callback();
        }
      };
      image.onerror = function (error) {
        if (callback) {
          callback(error);
        }
      };
      image.src = dataUrl;
    }
  }, {
    key: 'handleMouseDown',
    value: function handleMouseDown(event) {
      if (event.button === 0) {
        this.mouseButtonDown = true;
        this.strokeBegin(event);
      }
    }
  }, {
    key: 'handleMouseMove',
    value: function handleMouseMove(event) {
      if (this.mouseButtonDown) {
        this.strokeMoveUpdate(event);
      }
    }
  }, {
    key: 'handleMouseUp',
    value: function handleMouseUp(event) {
      if (event.button === 0 && this.mouseButtonDown) {
        this.mouseButtonDown = false;
        this.strokeEnd(event);
      }
    }
  }, {
    key: 'handleTouchStart',
    value: function handleTouchStart(event) {
      if (event.targetTouches.length === 1) {
        var touch = event.changedTouches[0];
        this.strokeBegin(touch);
      }
    }
  }, {
    key: 'handleTouchMove',
    value: function handleTouchMove(event) {
      event.preventDefault();
      var touch = event.targetTouches[0];
      this.strokeMoveUpdate(touch);
    }
  }, {
    key: 'handleTouchEnd',
    value: function handleTouchEnd(event) {
      var wasCanvasTouched = event.target === this.canvas;
      if (wasCanvasTouched) {
        event.preventDefault();
        this.strokeEnd(event);
      }
    }
  }, {
    key: 'strokeBegin',
    value: function strokeBegin(event) {
      this.data.push([]);
      this.reset();
      this.strokeUpdate(event);

      if (typeof this.props.onBegin === 'function') {
        this.props.onBegin(event);
      }
    }
  }, {
    key: 'strokeUpdate',
    value: function strokeUpdate(event) {
      var x = event.clientX;
      var y = event.clientY;

      var point = this.createPoint(x, y);

      var _addPoint = this.addPoint(point),
          curve = _addPoint.curve,
          widths = _addPoint.widths;

      if (curve && widths) {
        this.drawCurve(curve, widths.start, widths.end);
      }

      this.data[this.data.length - 1].push({
        x: point.x,
        y: point.y,
        time: point.time
      });
    }
  }, {
    key: 'strokeEnd',
    value: function strokeEnd() {
      var canDrawCurve = this.points.length > 2;
      var point = this.points[0];

      if (!canDrawCurve && point) {
        this.drawDot(point);
      }

      if (typeof this.props.onEnd === 'function') {
        this.props.onEnd(this.transformData());
      }
    }
  }, {
    key: 'transformData',
    value: function transformData() {
      var type = String(this.mimeType).toLowerCase();
      var data = void 0;
      var canvas = void 0;
      if (this.trim) {
        canvas = (0, _util.trim)(this.canvas);
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
        var byteString = atob(data.split(',')[1]);
        var mimeString = data.split(',')[0].split(':')[1].split(';')[0];
        var array = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i += 1) {
          array[i] = byteString.charCodeAt(i);
        }
        data = new Blob([array], { type: mimeString });
      }
      return data;
    }
  }, {
    key: 'createPoint',
    value: function createPoint(x, y, time) {
      var rect = this.canvas.getBoundingClientRect();

      return new _point2.default(x - rect.left, y - rect.top, time || new Date().getTime());
    }
  }, {
    key: 'addPoint',
    value: function addPoint(point) {
      var points = this.points;
      var tmp = void 0;
      points.push(point);
      if (points.length > 2) {
        // To reduce the initial lag make it work with 3 points
        // by copying the first point to the beginning.
        if (points.length === 3) points.unshift(points[0]);
        tmp = (0, _util.calculateCurveControlPoints)(points[0], points[1], points[2]);
        var c2 = tmp.c2;
        tmp = (0, _util.calculateCurveControlPoints)(points[1], points[2], points[3]);
        var c3 = tmp.c1;
        var curve = new _bezier2.default(points[1], c2, c3, points[2]);
        var widths = this.calculateCurveWidths(curve);
        // Remove the first element from the list,
        // so that we always have no more than 4 points in points array.
        points.shift();
        return { curve: curve, widths: widths };
      }
      return {};
    }
  }, {
    key: 'calculateCurveWidths',
    value: function calculateCurveWidths(curve) {
      var startPoint = curve.startPoint;
      var endPoint = curve.endPoint;
      var widths = { start: null, end: null };

      var velocity = this.velocityFilterWeight * endPoint.velocityFrom(startPoint) + (1 - this.velocityFilterWeight) * this.lastVelocity;

      var newWidth = this.strokeWidth(velocity);

      widths.start = this.lastWidth;
      widths.end = newWidth;

      this.lastVelocity = velocity;
      this.lastWidth = newWidth;

      return widths;
    }
  }, {
    key: 'strokeWidth',
    value: function strokeWidth(velocity) {
      return Math.max(this.maxWidth / (velocity + 1), this.minWidth);
    }
  }, {
    key: 'drawPoint',
    value: function drawPoint(x, y, size) {
      this.ctx.moveTo(x, y);
      this.ctx.arc(x, y, size, 0, 2 * Math.PI, false);
      if (typeof this.props.onChange === 'function') {
        this.props.onChange(false);
      }
    }
  }, {
    key: 'drawCurve',
    value: function drawCurve(curve, startWidth, endWidth) {
      var widthDelta = endWidth - startWidth;
      var drawSteps = Math.floor(curve.length());

      this.ctx.beginPath();

      for (var i = 0; i < drawSteps; i += 1) {
        // Calculate the Bezier (x, y) coordinate for this step.
        var t = i / drawSteps;
        var tt = t * t;
        var ttt = tt * t;
        var u = 1 - t;
        var uu = u * u;
        var uuu = uu * u;

        var x = uuu * curve.startPoint.x;
        x += 3 * uu * t * curve.control1.x;
        x += 3 * u * tt * curve.control2.x;
        x += ttt * curve.endPoint.x;

        var y = uuu * curve.startPoint.y;
        y += 3 * uu * t * curve.control1.y;
        y += 3 * u * tt * curve.control2.y;
        y += ttt * curve.endPoint.y;

        var width = startWidth + ttt * widthDelta;
        this.drawPoint(x, y, width);
      }

      this.ctx.closePath();
      this.ctx.fill();
    }
  }, {
    key: 'drawDot',
    value: function drawDot(point) {
      this.ctx.beginPath();
      this.drawPoint(point.x, point.y, this.dotSize);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.data = [];
      this.reset();
      if (typeof this.props.onChange === 'function') {
        this.props.onChange(true);
      }
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.points = [];
      this.lastVelocity = 0;
      this.lastWidth = (this.minWidth + this.maxWidth) / 2;
      this.ctx.fillStyle = this.penColor;
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      return _react2.default.createElement('canvas', {
        style: this.style,
        className: this.props.className,
        ref: function ref(canvas) {
          _this3.canvas = canvas;
        },
        onMouseDown: this.handleMouseDown,
        onMouseMove: this.handleMouseMove,
        onTouchStart: this.handleTouchStart,
        onTouchMove: this.handleTouchMove,
        onTouchEnd: this.handleTouchEnd
      });
    }
  }]);

  return Signature;
}(_react2.default.Component);

exports.default = Signature;
//# sourceMappingURL=index.js.map
