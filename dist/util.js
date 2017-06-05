'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.throttle = throttle;
exports.trim = trim;
exports.calculateCurveControlPoints = calculateCurveControlPoints;

var _point = require('./point');

var _point2 = _interopRequireDefault(_point);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// http://stackoverflow.com/a/27078401/815507
function throttle(func, wait, options) {
  for (var _len = arguments.length, all = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    all[_key - 3] = arguments[_key];
  }

  var context = void 0;
  var args = void 0;
  var result = void 0;
  var timeout = null;
  var previous = 0;
  var opts = options || {};
  var later = function later() {
    previous = opts.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) {
      args = null;
      context = args;
    }
  };
  return function call() {
    var now = Date.now();
    if (!previous && opts.leading === false) previous = now;
    var remaining = wait - (now - previous);
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

function trim(canvas) {
  var ctx = canvas.getContext('2d');
  var copy = document.createElement('canvas').getContext('2d');
  var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var length = pixels.data.length;
  var bound = {
    top: null,
    left: null,
    right: null,
    bottom: null
  };
  for (var i = 0; i < length; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      var x = i / 4 % canvas.width;
      var y = Math.floor(i / 4 / canvas.width);

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

  var trimHeight = bound.bottom - bound.top;
  var trimWidth = bound.right - bound.left;
  var trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

  copy.canvas.width = trimWidth;
  copy.canvas.height = trimHeight;
  copy.putImageData(trimmed, 0, 0);
  return copy.canvas;
}

function calculateCurveControlPoints(s1, s2, s3) {
  var dx1 = s1.x - s2.x;
  var dy1 = s1.y - s2.y;
  var dx2 = s2.x - s3.x;
  var dy2 = s2.y - s3.y;

  var m1 = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0 };
  var m2 = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0 };

  var l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  var l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  var dxm = m1.x - m2.x;
  var dym = m1.y - m2.y;

  var k = l2 / (l1 + l2);
  var cm = { x: m2.x + dxm * k, y: m2.y + dym * k };

  var tx = s2.x - cm.x;
  var ty = s2.y - cm.y;

  return {
    c1: new _point2.default(m1.x + tx, m1.y + ty),
    c2: new _point2.default(m2.x + tx, m2.y + ty)
  };
}
//# sourceMappingURL=util.js.map
