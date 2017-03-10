(function() {
    'use strict';

    angular.module('myapp', [
        'ui.router',
        'ngRap'
    ])
    .run(
        [   '$rootScope','$state','$stateParams',
            function($rootScope,$state,$stateParams){
                $rootScope.$state=$state;
                $rootScope.$stateParams=$stateParams;
            }
        ]
    )
    .config(
        [   '$stateProvider','$urlRouterProvider','$httpProvider',
            function($stateProvider,$urlRouterProvider,$httpProvider){
                //start the rap
                ngRapProvider.script = 'http://rap.taobao.org/rap.plugin.js?projectId=14899'; // replce your host and project id
                ngRapProvider.enable({
                    mode: 3 //3开启，0关闭
                });
                $httpProvider.interceptors.push('rapMockInterceptor');

                $urlRouterProvider
                    .otherwise('/');
                
                $stateProvider
                    .state("home",{
                        url:"/",
                        template:'let’s begin'
                    })

            }
        ]
    )
})();