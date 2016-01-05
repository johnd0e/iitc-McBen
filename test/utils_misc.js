var should=require('should');
var assert=require('assert');
require('./framework/mainwindow.js');

require('../code/utils_misc');


describe('utils_misc', function () {
  
  describe('getURLParam', function () {
    it("should get the values", function () {
      window.location.replace("https://www.ingress.com/intel?ll=val1&z=val2&pll=val3");
      window.getURLParam('ll').should.be.equal('val1');
      window.getURLParam('pll').should.be.equal('val3');
      window.getURLParam('z').should.be.equal('val2');
    });
    
    it("should get no values", function () {
      window.location.replace("https://www.ingress.com/intel?ll=val1&z=val2&pll=val3");
      window.getURLParam().should.be.empty();
      window.getURLParam('ff').should.be.empty();
    });
    
  });
  
  describe('zeroPad', function () {
    it('should be padded', function () {
      window.zeroPad(1,2).should.equal("01");
      window.zeroPad(100,2).should.equal("100");
    });
  });

  describe('digits', function () {
    it('should be seperated', function () {
      sep = '&#8201;'
      window.digits(1000).should.equal("1"+sep+"000");
      window.digits(1234567).should.equal("1"+sep+"234"+sep+"567");
    });
  });

  describe('String.capitalize', function () {
    it('should be capitalize', function () {
      'blUB'.capitalize().should.equal("Blub");
    });
  });

  describe('escapeHtmlSpecialChars', function () {
    it('tags should be converted', function () {
      window.escapeHtmlSpecialChars("<b>").should.equal("&lt;b&gt;");
    });
  });

  describe('escapeJavascriptString', function () {
    it('string should be valid javascriptstring', function () {
      window.escapeJavascriptString("\\\"\'").should.equal("\\\\\\\"\\\'");
    });
  });

  describe('prettyEnergy', function () {
    it('string should be valid javascriptstring', function () {
      window.prettyEnergy(100) .should.be.equal(100);
      window.prettyEnergy(1001).should.be.equal("1 k");
      window.prettyEnergy(1499).should.be.equal("1 k");
    });
  });

  describe.skip('genFourColumnTable', function () {
    global.escapeHtmlSpecialChars = window.escapeHtmlSpecialChars; // Mocha using different global name
    it('string should be valid javascriptstring', function () {
      var blocks = [ 'text1', 'text2', 'text3','text4'];
      var result = '<tr><td title="text">1</td><th title="text">0</th>';
      (window.genFourColumnTable(blocks)).should.be.equal(result);
    });
  });

  describe('convertTextToTableMagic', function () {
    it('string should be valid javascriptstring', function () {
      var intxt = '1\tVal1\n2\tVal2';
      var result = '<table>'
                  + '<tr><td>1</td><td>Val1</td></tr>'
                  + '<tr><td>2</td><td>Val2</td></tr></table>';
      (window.convertTextToTableMagic(intxt)).should.be.equal(result);
    });
  });


 });


