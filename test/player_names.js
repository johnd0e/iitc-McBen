var should=require('should');
var assert=require('assert');
require('./framework/mainwindow.js');

require('../code/player_names');
  
describe('player_names', function () {
  describe('isSystemPlayer', function () {
    it('should recognize ADA and JARVIS', function () {
      window.isSystemPlayer('__ADA__') .should.be.true;
      window.isSystemPlayer('__JARVIS__') .should.be.true;
      window.isSystemPlayer('someone') .should.be.false;
    });
  });
 });


