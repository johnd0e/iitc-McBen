/**
* Manage settings
**/
Settings = (function () {

    let storage;
    let date = Date.now();


    function get(group, key, defaultValues) {
        storage[group] = storage[group] || {};
        storage[group]._lastAccess = date;
        return (storage[group][key] || defaultValues);
    }


    function set(group, key, value) {
        storage[group] = storage[group] || {};
        storage[group]._lastAccess=date;
        storage[group][key] = value;
    }


    function getGroupRef(group, defaults) {

        storage[group] = storage[group] || {};
        if (defaults) {
            for (let key in defaults) {
                storage[group][key] = storage[group][key] || defaults[key];
            }
        }
        storage[group]._lastAccess=date;
        return storage[group];
    }



    function init() {
        let store = localStorage.getItem('iitc_settings');
        storage = JSON.parse(store || '{}');

        $(window).on('beforeunload',save);
    }


    function save() {
        cleanUp();
        localStorage.setItem('iitc_settings', JSON.stringify(storage));
    }

    function cleanUp() {
        let old = date - 1000*60*60*24*7; // 1Week
        for (let group in storage) {
            if (storage[group]._lastAccess<old) {
                delete storage[group];
            }
        }
    }


    return {
        init: init,
        get: get,
        set: set,
        getGroupRef: getGroupRef
    };


})();