var should=require('should');

includeJS('../../code/utils_misc')

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
  
  describe('digits', function () {
    it('should be seperated', function () {
      sep = '&#8201;'
      window.digits(1000).should.equal("1"+sep+"000");
      window.digits(1234567).should.equal("1"+sep+"234"+sep+"567");
    });
  });
  
  describe('zeroPad', function () {
    it('should be padded', function () {
      window.zeroPad(1,2).should.equal("01");
      window.zeroPad(100,2).should.equal("100");
    });
  });

  describe('unixTimeToString', function () {
    it('return nothing with no time', function () {
      should.not.exist(window.unixTimeToString()); //TODO: why not throwing an error?
    });
    
    it('return time string', function () {
      var d = new Date("3 30,2016 9:10:11");
      window.unixTimeToString(d).should.be.equal('2016-03-30');
      window.unixTimeToString(d,true).should.be.equal('2016-03-30 09:10:11');

      window.unixTimeToString(d.getTime().toString()).should.be.equal('2016-03-30');
      window.unixTimeToString(d.getTime().toString(),true).should.be.equal('2016-03-30 09:10:11');

      d = new Date(2016,02,30,9,10,11);
      window.unixTimeToString(d).should.be.equal('2016-03-30');
      window.unixTimeToString(d,true).should.be.equal('2016-03-30 09:10:11');
    });
      
    it('return time string without date if it is today', function () {
      var d = new Date();
      d.setHours(10);
      d.setMinutes(11);
      d.setSeconds(12);
      window.unixTimeToString(d).should.be.equal('10:11:12');
      window.unixTimeToString(d,true).should.match(/\d\d\d\d-\d\d-\d\d 10:11:12$/);
    });
  });

  describe('unixTimeToDateTimeString', function () {
    it('return nothing with no time', function () {
      should.not.exist(window.unixTimeToDateTimeString()); //TODO: why not throwing an error?
    });
    
    it('return time string', function () {
      var d = new Date("3 30,2016 9:10:11");
      window.unixTimeToDateTimeString(d).should.be.equal('2016-03-30 09:10:11');
      window.unixTimeToDateTimeString(d.getTime().toString()).should.be.equal('2016-03-30 09:10:11');
      
      var d = new Date("3 30,2016 9:10:11:023");
      window.unixTimeToDateTimeString(d,true).should.be.equal('2016-03-30 09:10:11.023');

    });
  });

  //TODO: unixTimeToString(x,true) = unixTimeToDateTimeString(x)
  describe('unixTimeToString double', function () {
    it('return time string', function () {
      var d = new Date("3 30,2016 9:10:11");
      window.unixTimeToString(d,true).should.be.equal( window.unixTimeToDateTimeString(d));

      d = new Date(2016,02,30,9,10,11);
      window.unixTimeToString(d,true).should.be.equal( window.unixTimeToDateTimeString(d));
    });
      
    it('return time string without date if it is today', function () {
      var d = new Date();
      d.setHours(10);
      d.setMinutes(11);
      d.setSeconds(12);
      window.unixTimeToString(d,true).should.be.equal( window.unixTimeToDateTimeString(d));
    });
  });

  describe('unixTimeToHHmm', function () {
    it('return nothing with no time', function () {
      should.not.exist(window.unixTimeToHHmm()); //TODO: why not throwing an error?
    });
    
    it('return time string', function () {
      var d = new Date("3 30,2016 9:8:11");
      window.unixTimeToHHmm(d).should.be.equal('09:08');
      window.unixTimeToHHmm(d.getTime()).should.be.equal('09:08');
      
      var d = new Date("3 30,2016 11:12:13");
      window.unixTimeToHHmm(d).should.be.equal('11:12');
    });
  });

  
  describe('formatInterval', function () {
    it('should return time interval', function () {
      
      window.formatInterval(0).should.be.equal('0s');
      
      var s = 11;
      window.formatInterval(s).should.be.equal('11s');
      
      s += 12*60;
      window.formatInterval(s).should.be.equal('12m 11s');
      s += 13*60*60;
      window.formatInterval(s).should.be.equal('13h 12m 11s');
      s += 4*60*60*24;
      window.formatInterval(s).should.be.equal('4d 13h 12m 11s');
    });
    
    it('should return time interval', function () {
      var s =1+2*60+3*60*60+4*60*60*24;
      window.formatInterval(s,9).should.be.equal('4d 3h 2m 1s');
      window.formatInterval(s,2).should.be.equal('4d 3h');
      window.formatInterval(s,1).should.be.equal('4d');
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

  describe('uniqueArray', function () {
    it('should remove all duplicated values', function () {
      var a = [1,2,3,4];
      window.uniqueArray(a).should.be.eql(a);
      
      var b = [1,2,3,4,2,1,2,3,4];
      window.uniqueArray(b).should.be.eql(a);
    });
  });

  // FIXME: genFourColumnTable 
  describe.skip('genFourColumnTable', function () {
    it('should generate a valid html row', function () {
      var blocks = [ ['0', '1','text']];
      var expect = '<tr><td title="text">1</td><th title="text">0</th></tr>'; 
      
      var result = window.genFourColumnTable(blocks);
      result.should.be.equal(expect); 
    });
      
    it('should generate a valid html row with 2 values', function () {
      var blocks = [ ['label_1', 'value_1','title_1'],['label_2', 'value_2','title_2'] ];
      var expect = '<tr><td title="title_1">value_1</td><th title="title_1">label_1</th>'
                  +'    <td title="title_2">value_2</td><th title="title_2">label_2</th></tr>';
      
      var result = window.genFourColumnTable(blocks);
      result.should.be.equal(expect);
      (window.genFourColumnTable(blocks)).should.be.equal(result);
    });
    
    it('should generate a valid html row with 2 values', function () {
      var blocks = [ ['label_1', 'value_1','title_1'],['label_2', 'value_2','title_2'] ,
                     ['label_3', 'value_3','title_3'],['label_4', 'value_4','title_4'] ];
      var expect = '<tr><td title="title_1">value_1</td><th title="title_1">label_1</th>'
                   +    '<td title="title_2">value_2</td><th title="title_2">label_2</th></tr>'
                   +'<tr><tr><td title="title_3">value_3</td><th title="title_3">label_3</th>'
                   +    '<td title="title_4">value_4</td><th title="title_4">label_4</th></tr>';      
      var result = window.genFourColumnTable(blocks);
      result.should.be.equal(expect);
      (window.genFourColumnTable(blocks)).should.be.equal(result);
    });
    
  });

  describe('convertTextToTableMagic', function () {
    it('should be generate valid 2row table', function () {
      var intxt = '1\tVal1\n2\tVal2';
      var result = '<table>'
                  + '<tr><td>1</td><td>Val1</td></tr>'
                  + '<tr><td>2</td><td>Val2</td></tr></table>';
      (window.convertTextToTableMagic(intxt)).should.be.equal(result);
    });

    it('should be generate valid 3row table', function () {
      var intxt = '1\tVal1\n2\tVal2\n3';
      var result = '<table>'
                  + '<tr><td>1</td><td>Val1</td></tr>'
                  + '<tr><td>2</td><td>Val2</td></tr>'
                  + '<tr><td colspan="2">3</td></tr></table>';
      (window.convertTextToTableMagic(intxt)).should.be.equal(result);
    });

    it('should generate no table if no coloumns', function () {
      intxt = '1\n2'; 
      result = '1<br>2';
      (window.convertTextToTableMagic(intxt)).should.be.equal(result);
      
    });
  });

  describe('calcTriArea', function () {
    it('should calculate area', function () {
      
      var p=[ new L.LatLng(1,1), new L.LatLng(1,5),new L.LatLng(5,1) ];
      window.calcTriArea(p).should.be.equal(4*4/2);

      p=[ new L.LatLng(-1,-1), new L.LatLng(-1,-5),new L.LatLng(-5,-11) ];
      window.calcTriArea(p).should.be.equal(4*4/2);
    });
  });
 });


