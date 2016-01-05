var should=require('should');
var assert=require('assert');
require('./framework/mainwindow.js');


greatCircleArcIntersect = function(a0,a1,b0,b1) {
  // based on the formula at http://williams.best.vwh.net/avform.htm#Int

  // method:
  // check to ensure no line segment is zero length - if so, cannot cross
  // check to see if either of the lines start/end at the same point. if so, then they cannot cross
  // check to see if the line segments overlap in longitude. if not, no crossing
  // if overlap, clip each line to the overlapping longitudes, then see if latitudes cross

  // anti-meridian handling. this code will not sensibly handle a case where one point is
  // close to -180 degrees and the other +180 degrees. unwrap coordinates in this case, so one point
  // is beyond +-180 degrees. this is already true in IITC
  // FIXME? if the two lines have been 'unwrapped' differently - one positive, one negative - it will fail

  // zero length line tests
  if (a0.equals(a1)) return false;
  if (b0.equals(b1)) return false;

  // lines have a common point
  if (a0.equals(b0) || a0.equals(b1)) return false;
  if (a1.equals(b0) || a1.equals(b1)) return false;


  // check for 'horizontal' overlap in lngitude
  if (Math.min(a0.lng,a1.lng) > Math.max(b0.lng,b1.lng)) return false;
  if (Math.max(a0.lng,a1.lng) < Math.min(b0.lng,b1.lng)) return false;


  // ok, our two lines have some horizontal overlap in longitude
  // 1. calculate the overlapping min/max longitude
  // 2. calculate each line latitude at each point
  // 3. if latitudes change place between overlapping range, the lines cross


  // class to hold the pre-calculated maths for a geodesic line
  // TODO: move this outside this function, so it can be pre-calculated once for each line we test
  var GeodesicLine = function(start,end) {
    var d2r = Math.PI/180.0;
    var r2d = 180.0/Math.PI;

    // maths based on http://williams.best.vwh.net/avform.htm#Int

    if (start.lng == end.lng) {
      throw 'Error: cannot calculate latitude for meridians';
    }

    // only the variables needed to calculate a latitude for a given longitude are stored in 'this'
    this.lat1 = start.lat * d2r;
    this.lat2 = end.lat * d2r;
    this.lng1 = start.lng * d2r;
    this.lng2 = end.lng * d2r;

    var dLng = this.lng1-this.lng2;

    var sinLat1 = Math.sin(this.lat1);
    var sinLat2 = Math.sin(this.lat2);
    var cosLat1 = Math.cos(this.lat1);
    var cosLat2 = Math.cos(this.lat2);

    this.sinLat1CosLat2 = sinLat1*cosLat2;
    this.sinLat2CosLat1 = sinLat2*cosLat1;

    this.cosLat1CosLat2SinDLng = cosLat1*cosLat2*Math.sin(dLng);
  }

  GeodesicLine.prototype.isMeridian = function() {
    return this.lng1 == this.lng2;
  }

  GeodesicLine.prototype.latAtLng = function(lng) {
    lng = lng * Math.PI / 180; //to radians

    var lat;
    // if we're testing the start/end point, return that directly rather than calculating
    // 1. this may be fractionally faster, no complex maths
    // 2. there's odd rounding issues that occur on some browsers (noticed on IITC MObile) for very short links - this may help
    if (lng == this.lng1) {
      lat = this.lat1;
    } else if (lng == this.lng2) {
      lat = this.lat2;
    } else {
      lat = Math.atan ( (this.sinLat1CosLat2*Math.sin(lng-this.lng2) - this.sinLat2CosLat1*Math.sin(lng-this.lng1))
                       / this.cosLat1CosLat2SinDLng);
    }
    return lat * 180 / Math.PI; // return value in degrees
  }



  // calculate the longitude of the overlapping region
  var leftLng = Math.max( Math.min(a0.lng,a1.lng), Math.min(b0.lng,b1.lng) );
  var rightLng = Math.min( Math.max(a0.lng,a1.lng), Math.max(b0.lng,b1.lng) );

  // calculate the latitudes for each line at left + right longitudes
  // NOTE: need a special case for meridians - as GeodesicLine.latAtLng method is invalid in that case
  var aLeftLat, aRightLat;
  if (a0.lng == a1.lng) {
    // 'left' and 'right' now become 'top' and 'bottom' (in some order) - which is fine for the below intersection code
    aLeftLat = a0.lat;
    aRightLat = a1.lat;
  } else {
    var aGeo = new GeodesicLine(a0,a1);
    aLeftLat = aGeo.latAtLng(leftLng);
    aRightLat = aGeo.latAtLng(rightLng);
  }

  var bLeftLat, bRightLat;
  if (b0.lng == b1.lng) {
    // 'left' and 'right' now become 'top' and 'bottom' (in some order) - which is fine for the below intersection code
    bLeftLat = b0.lat;
    bRightLat = b1.lat;
  } else {
    var bGeo = new GeodesicLine(b0,b1);
    bLeftLat = bGeo.latAtLng(leftLng);
    bRightLat = bGeo.latAtLng(rightLng);
  }

  // if both a are less or greater than both b, then lines do not cross
  if (aLeftLat < bLeftLat && aRightLat < bRightLat) return false;
  if (aLeftLat > bLeftLat && aRightLat > bRightLat) return false;

  // latitudes cross between left and right - so geodesic lines cross
  return true;
}




// FIXME: plugin loading requires
//   - parsing of generated DOM
//   - (or better) renaming of Keywords of build script

//~ require('../build/local/plugins/cross_link.user');


describe('Plugin: crosslink', function () {

  describe.skip('interction test', function () {

    // BUG Report 1:
    // https://www.ingress.com/intel?ll=-37.223108,149.292838&z=17&pll=-37.223108,149.292838
    var a0 = new L.LatLng(149.292838, -37.223108);
    // https://www.ingress.com/intel?ll=-18.846971,-159.757914&z=17&pll=-18.846971,-159.757914
    var a1 = new L.LatLng(-159.757914, -18.846971);

    // https://www.ingress.com/intel?ll=-36.242674,149.131549&z=17&pll=-36.242674,149.131549
    var b0 = new L.LatLng(149.131549, -36.242674);
    // https://www.ingress.com/intel?ll=-37.342376,148.700603&z=17&pll=-37.342376,148.700603
    var b1 = new L.LatLng(148.700603 , -37.342376);

    it('should not cross', function () {
      var is_crossing = greatCircleArcIntersect(a0,a1,b0,b1);
      is_crossing.should.be.equal(false);
    });

  });
});

