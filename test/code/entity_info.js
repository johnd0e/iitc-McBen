var should=require('should');

includeJS('../../code/entity_info');

describe('entity_info', function () {
  describe('teamStringToId', function () {
    it('should map string to ID', function () {
      window.teamStringToId('ENLIGHTENED').should.be.equal(TEAM_ENL);
      window.teamStringToId('E').should.be.equal(TEAM_ENL);
      window.teamStringToId('RESISTANCE').should.be.equal(TEAM_RES);
      window.teamStringToId('R').should.be.equal(TEAM_RES);
      
      window.teamStringToId('anything').should.be.equal(TEAM_NONE);
    });
  });
  
  describe('getTeam', function () {
    it('should get team from portal details', function () {
      window.getTeam({team: 'E'}).should.be.equal(TEAM_ENL);
    });
  });
  
 });


