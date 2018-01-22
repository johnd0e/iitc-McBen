Menu= (function () {


  function moveFromToolBox() {
    $('#toolbox a').each( parseToolBox );
  }

  function parseToolBox() {
    let $link = $(this);

    let menu = {
      name: $link.text(),
      title:  $link.attr('title'),
      onclick: $link.attr('onclick'),
      key: $link.attr('accesskey'),
    };

    addMenu(menu);
  }

  function addMenu(menu_data) {
    let $entry = createMenuLabel(menu_data.name);
  }

  function createMenuLabel(name) {
    let $root = $('#mainmenu > ul')

    console.log("- Create Menu: "+name);
    let names = name.split('/');
    if (names.length===1) names.splice(0,0,'Misc');

    let $menu = getOrCreateMenuLabel($root, names);
  }

// $('#mainmenu > ul').find('> li').filter( function () {console.log($(this).contents().not($(this).children()).text())});

  function getOrCreateMenuLabel($root, names) {
    let $base = $root.find('> li').filter( function () {
      return $(this).contents().not($(this).children()).text() === names[0];
    });

    if ($base.length===0)  {

      console.log("- Create -> : "+names[0]);
      let $base = $('<li>'+names[0]+'</li>');
      $root.append($base);
    };

    names.splice(0,1);

    if (names.length===0) return $base;

    let $sub =  $base.find('> ul');
    if ($sub.length===0)  {
      let $sub = $('<ul>');
      $base.append($sub);
    };

    return getOrCreateMenuLabel($sub, names);
  }



  function setup() {

    let menu = $('<div id="mainmenu"><ul></ul></div>')
    $( document.body ).append(menu);

    window.setTimeout(Menu.moveFromToolBox,100);
  }

  return {
    setup : setup,
    addMenu: addMenu,
    moveFromToolBox: moveFromToolBox
  };

}());

