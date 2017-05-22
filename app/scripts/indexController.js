(function () {
    'use strict';

    angular
        .module('myapp')
        .controller('indexController', indexController);

    indexController.$inject = [];
    function indexController() {
        var vm = this;

        vm.name = "word!!";
        activate();

        ////////////////

        function activate() { }
    }
})();