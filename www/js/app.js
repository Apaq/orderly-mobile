function apNavClearDirective($ionicViewService, $state) {
    return {
        restrict: 'AC',
        link: function($scope, $element, $attr) {
            var uiSref = $attr.uiSref;
            $element.bind('click', function() {
                if (!$state.is(uiSref)) {
                    $ionicViewService.nextViewOptions({
                        disableAnimate: true,
                        disableBack: true
                    });
                }
            });
        }
    };
}
apNavClearDirective.$$inject = ['$ionicViewService', '$state'];

function ApplicationConfig($stateProvider, $urlRouterProvider, $httpProvider, agendasProvider, $compileProvider, $translateProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|sms):/);

    $translateProvider.translations('da', {
        TASK_TYPES: {
            Witnessing: 'Forkyndelse',
            Public_Talk: 'Offentligt foredrag', 
            Watchtower_Study: 'Vagttårnsstudie', 
            BibleStudy: 'Menighedsbibelstudie', 
            BibleReading: 'Bibellæsning', 
            SchoolBibleRecitation: 'Bibeloplæsning', 
            SchoolAssignment: 'Skoleopgave', 
            Talk: 'Foredrag', 
            Song: 'Sang', 
            Prayer: 'Bøn', 
            SchoolReview: 'Mundtlig repetition',
            FieldServiceMeeting: 'Samling',
            ManageSound: 'Mikser',
            ManagePlatform: 'Platform',
            Cleaning: 'Rengøring'
        },
        EVENT_TYPES: {
            PublicWitnessing: "Offentlig forkyndelse",
            CongregationMeeting: "Menighedsmøde", 
            FieldsServiceMeeting: "Samling", 
            EldersMeeting: "Ældstemøde", 
            Assembly: "Stævne", 
            PortService: "Havneforkyndelse"
        },
        ASSIGNMENT_TYPES: {
            Unspecified: "Uspecificeret", 
            Conductor: "Leder", 
            Assistant: "Assistent"
        }
    });

    $translateProvider.preferredLanguage('da');

    $httpProvider.interceptors.push(function($location, $q) {
        return {
            'responseError': function(rejection) {
                if (rejection.status === 401) {
                    $location.path('/login');
                    return $q.reject("Not authorized.");
                }
                if (rejection.status === 0) {
                    $location.path('/login');
                    return $q.reject("Cannot contact server.");
                }
                return rejection;
            }
        };
    });

    $httpProvider.defaults.transformResponse.push(function(responseData) {
        agendasProvider.convertDateStringsToDates(['startTime', 'endTime'], responseData);
        return responseData;
    });

    $stateProvider
            .state('menu', {
                url: "/menu",
                abstract: true,
                templateUrl: "templates/menu.html"
            })
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })
            .state('menu.assignments', {
                url: '/assignments',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/assignments.html',
                        controller: 'AssignmentsCtrl'
                    }
                }
            })

            .state('menu.assignments.edit', {
                url: '/:aid',
                views: {
                    'menuContent@menu': {
                        templateUrl: 'templates/assignment-edit.html',
                        controller: 'AssignmentEditCtrl'
                    }
                }
            })
    
            .state('menu.available-assignments', {
                url: '/available-assignments',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/available-assignments.html',
                        controller: 'AvailableAssignmentsCtrl'
                    }
                }
            })

            .state('menu.events', {
                url: '/events',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/events.html',
                        controller: 'EventsCtrl'
                    }
                }
            })

            .state('menu.events.edit', {
                url: '/:id',
                views: {
                    'menuContent@menu': {
                        templateUrl: 'templates/event-edit.html',
                        controller: 'EventEditCtrl'
                    }
                }
            })

            .state('menu.task', {
                url: '/events/:id/agendas/:aid/tasks/:tid',
                views: {
                    'menuContent@menu': {
                        templateUrl: 'templates/task-edit.html',
                        controller: 'TaskEditCtrl'
                    }
                }
            })

            .state('menu.persons', {
                url: '/persons',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/persons.html',
                        controller: 'PersonsCtrl'
                    }
                }
            })

            .state('menu.persons.edit', {
                url: '/:id',
                views: {
                    'menuContent@menu': {
                        templateUrl: 'templates/person-edit.html',
                        controller: 'PersonEditCtrl'
                    }
                }
            })

            .state('menu.groups', {
                url: '/groups',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/groups.html',
                        controller: 'GroupsCtrl'
                    }
                }
            })

            .state('menu.groups.edit', {
                url: '/:gid',
                views: {
                    'menuContent@menu': {
                        templateUrl: 'templates/group-edit.html',
                        controller: 'GroupEditCtrl'
                    }
                }
            });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

}
ApplicationConfig.$$inject = ['$stateProvider', '$urlRouterProvider'];

function ApplicationBoot($http, agendas) {
    $http.get('config.json').success(function(data) {
        agendas.setServiceUrl(data.serviceUrl);
    });
}
ApplicationBoot.$$inject = ['$http', 'agendas'];


angular.module('agendas', ['ionic', 'agendas.services', 'agendas.controllers', 'pascalprecht.translate'])
        .config(ApplicationConfig)
        .directive({
            apNavClear: apNavClearDirective
        })
        .run(ApplicationBoot);
