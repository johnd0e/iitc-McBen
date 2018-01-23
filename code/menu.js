Menu= (function () {


  function moveFromToolBox() {
    $('#toolbox a').each( parseToolBox );

    $('#mainmenu > ul > li:not(:has(>ul))').remove();
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

    if (menu_data.onclick) {
      let fct = menu_data.onclick;
      if (typeof(fct)==='string') fct = new Function(fct);
      $entry.click(fct);
      $entry.css('cursor','pointer');
    }

    if (menu_data.title) $entry.attr('title',menu_data.title);
  }

  function createMenuLabel(name) {
    let $root = $('#mainmenu > ul')

    let names = name.split('/');
    if (names.length===1) names.splice(0,0,'Misc');

    return getOrCreateMenuLabel($root, names);
  }

  function getOrCreateMenuLabel($root, names) {
    let $base = $root.find('> li').filter( function () {
      return $(this).contents().not($(this).children()).text() === names[0];
    });

    if ($base.length===0)  {
      $base = $('<li>'+names[0]+'</li>');
      $root.append($base);
    };

    names.splice(0,1);

    if (names.length===0) return $base;

    let $sub =  $base.find('> ul');
    if ($sub.length===0)  {
      $sub = $('<ul>');
      $base.append($sub);
    };

    return getOrCreateMenuLabel($sub, names);
  }

  function createBasicMenu() {
    let $root = $('#mainmenu > ul')
    getOrCreateMenuLabel($root,['View']);
    getOrCreateMenuLabel($root,['Misc']);
    getOrCreateMenuLabel($root,['Help']);

    addMenu({name: 'Help/About IITC', onclick: window.aboutIITC });
    addMenu({name: 'View/Zoom Control', onclick: toggleZoomControl});
    addMenu({name: 'View/Toolbox', onclick: toggleToolbox});
  }

  function toggleZoomControl() {
    $(".leaflet-control-zoom").toggle();
  }

  function toggleToolbox() {
    $("#toolbox").toggle();
  }

  function setup() {

    let menu = $('<div id="mainmenu"><ul id="mainmenutop"></ul></div>')
    $( document.body ).append(menu);

    createBasicMenu();

    window.setTimeout(Menu.moveFromToolBox,100);
  }

  return {
    setup : setup,
    addMenu: addMenu,
    moveFromToolBox: moveFromToolBox
  };

}());

