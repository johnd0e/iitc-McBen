
Redeem= (function () {

  const REDEEM_SHORT_NAMES = {
    'portal shield':'S',
    'force amp':'FA',
    'link amp':'LA',
    'heatsink':'H',
    'multihack':'M',
    'turret':'T',
    'unusual object':'U',
    'resonator':'R',
    'xmp burster':'X',
    'power cube':'C',
    'media':'M',
    'ultra strike':'US',
  };

  const REDEEM_STATUSES = {
    429: 'You have been rate-limited by the server. Wait a bit and try again.',
    500: 'Internal server error'
  };


  var requested_code;
  var request_result;


  function showDialog() {

    let html =
      '<input id="redeem" placeholder="Redeem code…" type="text" onClick="this.setSelectionRange(0, this.value.length)"/>'+
      '<button id="redeembtm" type="button" class="ui-button ui-corner-all ui-widget">OK</button>'+
      '<div id="result"></div>';


    let dia = dialog({
      title: 'Redeem Passcode',
      id: 'RedeemDialog',
      html: html,
      buttons: {
        'close': closeDialog,
        'format': { id: 'format', class: 'left', click: changeFormat },
        'copy': { text: 'copy', class: 'left', click: copyText }
      },
    });


    $('#dialog-RedeemDialog').parent().find('.ui-dialog-buttonset button:contains("OK")').hide();
    $('#dialog-RedeemDialog').parent().find('.ui-dialog-buttonset button#format').text(localStorage['iitc-passcode-format'] || 'long');

    $('#dialog-RedeemDialog #redeem').keypress(onKeypressed);
    $('#dialog-RedeemDialog #redeembtm').click( function() {redeemCode($('#dialog-RedeemDialog #redeem').val());} );

    if (requested_code) {
      $('#dialog-RedeemDialog #redeem').val(requested_code);
      disableInput();
    }
  }

  function closeDialog() {
    $('#dialog-RedeemDialog').dialog('close');
    request_result=undefined;
  }

  function disableInput() {
    $('#dialog-RedeemDialog #result').html('validating....');

    $('#dialog-RedeemDialog #redeem').attr('disabled','disabled');
    $('#dialog-RedeemDialog #redeembtm').attr('disabled','disabled');
  }

  function showResult(html) {

    if ($('#dialog-RedeemDialog').length===0) showDialog();

    $('#dialog-RedeemDialog #redeem').removeAttr('disabled');
    $('#dialog-RedeemDialog #redeembtm').removeAttr('disabled');
    $('#dialog-RedeemDialog #result').html(html);
  }


  function onKeypressed(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var passcode = $(this).val();
    passcode = passcode.replace(/[^\x20-\x7E]+/g, '');
    if(!passcode) return;

    redeemCode(passcode);
  }


  function redeemCode(passcode) {
    requested_code = passcode;
    disableInput();

    window.postAjax('redeemReward', {passcode:passcode}, handleRedeemResponse, handleRedeemError );
  }


  function handleRedeemResponse(data) {

    requested_code=undefined;

    if (data.error) {
      showResult('<strong>' + data.error + '</strong>');
      return;
    }

    if (!data.rewards) {
      showResult('<strong>An unexpected error occured</strong>');
      return;
    }

    if (data.playerData) {
      window.PLAYER = data.playerData;
      window.setupPlayerStat();
    }

    request_result = data.rewards;
    outputReward();
  }

  function changeFormat() {
    let newformat = (localStorage['iitc-passcode-format']!=='short') ? 'short' : 'long';
    localStorage['iitc-passcode-format']=newformat;

    $('#dialog-RedeemDialog').parent().find('.ui-dialog-buttonset button#format').text(newformat);
    outputReward();
  }

  function outputReward() {
    let formater = formatPasscodeLong;
    if (localStorage['iitc-passcode-format'] ==='short') {
      formater = formatPasscodeShort;
    }

    if (request_result) {
      showResult(formater(request_result));
    }
  }


  function formatPasscodeLong (data) {
    var html = '<strong>Passcode confirmed. Acquired items:</strong></p><ul class="redeemReward">';

    if(data.other) {
      data.other.forEach(function(item) {
        html += '<li>' + window.escapeHtmlSpecialChars(item) + '</li>';
      });
    }

    if (data.xm > 0)
      html += '<li>' + window.escapeHtmlSpecialChars(data.xm) + ' XM</li>';
    if (data.ap > 0)
      html += '<li>' + window.escapeHtmlSpecialChars(data.ap) + ' AP</li>';

    if(data.inventory) {
      data.inventory.forEach(function(type) {
        type.awards.forEach(function(item) {
          html += '<li>' + item.count + 'x ';

          var l = item.level;
          if(l > 0) {
            l = parseInt(l);
            html += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
          }

          html += window.escapeHtmlSpecialChars(type.name) + '</li>';
        });
      });
    }

    html += '</ul>';
    return html;
  }

  function formatPasscodeShort(data) {

    let awards = [];
    if(data.other) {
      awards = data.other.map(window.escapeHtmlSpecialChars);
    }

    if(0 < data.xm)
      awards.push(window.escapeHtmlSpecialChars(data.xm) + ' XM');
    if(0 < data.ap)
      awards.push(window.escapeHtmlSpecialChars(data.ap) + ' AP');

    if(data.inventory) {
      data.inventory.forEach(function(type) {
        type.awards.forEach(function(item) {
          var str = '';
          if(item.count > 1)
            str += item.count + '&nbsp;';

          let shortName = REDEEM_SHORT_NAMES[type.name.toLowerCase()];
          let level = parseInt(item.level);

          if (shortName) {
            if (level>0) {
              str += '<span class="itemlevel" style="color:' + COLORS_LVL[level] + '">' + shortName + level + '</span>';
            } else {
              str += shortName;
            }
          } else {

            if(level>0) {
              str += '<span class="itemlevel" style="color:' + COLORS_LVL[level] + '">L' + level + '</span> ';
            }
            str += type.name;
          }

          awards.push(str);
        });
      });
    }

    return '<p class="redeemReward">' + awards.join(', ') + '</p>';
  }


  function copyText() {
    let text = $('#dialog-RedeemDialog .redeemReward').html();
    if (!text) return;
    let input = document.createElement('textarea');
    document.body.append(input);
    text = text.replace(/<\/li>/g,'\n');
    text = text.replace(/&nbsp;/g,' ');
    text = text.replace(/<.+?>/g,'');
    input.value = text;
    input.select();
    document.execCommand('Copy');
    document.body.removeChild(input);
  }

  function handleRedeemError(response) {
    var text = '<strong>Server error</strong><p>';
    if(response.status) {
      text += (REDEEM_STATUSES[response.status] || 'The server indicated an error.') + ' (HTTP ' + response.status + ')';
    }

    showResult(text);
  }


  function setup() {

    Menu.addMenu({
      name: 'Action/Passcode',
      tooltip: 'Redeem Passcodes',
      onclick: showDialog
    });
  }


  return {
    setup : setup,
    showDialog: showDialog,
  };

}());



