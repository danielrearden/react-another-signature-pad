function Point(x, y, time) {
  this.x = x;
  this.y = y;
  this.time = time || new Date().getTime();
}

Point.prototype.velocityFrom = function (start) {
  return (this.time !== start.time) ? this.distanceTo(start) / (this.time - start.time) : 1;
};

Point.prototype.distanceTo = function (start) {
  return Math.sqrt(((this.x - start.x) ** 2) + ((this.y - start.y) ** 2));
};

export default Point;
