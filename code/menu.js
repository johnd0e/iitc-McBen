Menu= (function () { 

	function setup() {
		let $container = $('<div id="menuContainer">')

		let $button = $('<div id="menuToggle">')
			.append($('<input type="checkbox" />'))
			.append($('<span>'))
			.append($('<span>'))
			.append($('<span>'));

		let $menu = $('<div id="menu">')

		$menu.append(
			'<button onclick="myFunction()" class="dropbtn">Dropdown</button>'+
  		'<div id="myDropdown" class="dropdown-content">'+
    	'<a href="#">Link 1</a><a href="#">Link 2</a><a href="#">Link 3</a>'+
  		'</div>');


		$container.append($button);
		$container.append($menu);

		$('body').append($container);

		window.setTimeout(createMenu,100)
	}

  createMenu() {

  }

  addMenu(item) {
  	let path = item.split('/');
  	if (path.length<1) path.splice(1,0,'misc');

  	let base = $('#menu > li#'+path[0]+' ul');
  	if (base.length===0) {
  		let base = $('<ul />')
  		let submenu = $('<li id="'+path[0]+'">'+path[0]+'</li>')
  		submenu.append(base)
			$('#menu').append(submenu);
  	}

  	for 
		let submenu = $('<li id="'+path[0]+'">'+path[0]+'</li>')
  }



  return {
		setup: setup,
		addMenu: addMenu,
  };

}());

