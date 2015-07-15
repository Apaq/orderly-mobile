/*********************************************************************************************
 * LOGIN CONTROLLER                                                                          *
 *********************************************************************************************/
function LoginCtrl($scope, LoginSvc, $location, PersonSvc, $ionicPlatform) {
    $scope.credentials = {};
    $scope.rememberMe = false;
    $scope.status = null;
    $scope.state = 'Loading';

    $scope.checkLogin = function () {
        PersonSvc.get({
            id: 'current'
        }).$promise
            .then(
                function () {
                    $location.path('/menu/assignments');
                },
                function () {
                    $scope.state = 'Login';
                });
    };

    $scope.login = function () {
        $scope.state = 'LoggingIn';
        LoginSvc.authenticate($scope.credentials.username, $scope.credentials.password, $scope.credentials.rememberMe).then(function (user) {
            $scope.status = 'success';
            $scope.currentUser = user;
            $location.path('/menu/assignments');
        }, function (reason) {
            $scope.state = 'Login';
            $scope.status = "invalid";
        });
    };

    $scope.requestPassword = function () {
        $location.path('/request_password');
    };

    
    $ionicPlatform.ready(function() {
        $scope.checkLogin();
    });
}


/*********************************************************************************************
 * ASSIGNMENTS CONTROLLER                                                                    *
 *********************************************************************************************/
function AssigmentsCtrl($scope, AssignmentSvc) {
    $scope.state='';
    
    $scope.getDatesOfAssignments = function () {
        var currentDate = null,
            eventDate, dates = [];
        angular.forEach($scope.assignments, function (assignment) {
            date = new Date(assignment.startTime);
            if (currentDate === null || currentDate.toLocaleDateString() !== date.toLocaleDateString()) {
                currentDate = date;
                dates.push(currentDate);
            }
        });
        return dates;
    };

    $scope.$watch('assignments.$resolved', function () {
        $scope.dates = $scope.getDatesOfAssignments();
        
        if($scope.assignments.$resolved) {
            $scope.hideSpinner();
            $scope.state = '';
            $scope.$broadcast('scroll.refreshComplete');
        }
    });

    $scope.load = function() {
        $scope.showSpinner();
        $scope.state = 'Loading';
        $scope.assignments = AssignmentSvc.query({pid: 'current'});
    }
    
    $scope.load();

}


/*********************************************************************************************
 * ASSIGNMENT EDIT CONTROLLER                                                                *
 *********************************************************************************************/
function AssignmentEditCtrl($scope, $stateParams, AssignmentSvc) {
    $scope.taskId = $stateParams.aid;
    
    $scope.load = function() {
        $scope.showSpinner();
        $scope.task = AssignmentSvc.get({
            pid: '4028d7f2462372a401462372abc20001',
            id: $scope.taskId
        });
        $scope.task.$promise.then(function() {
            $scope.hideSpinner();
        });
    };
    $scope.load();
}


/*********************************************************************************************
 * AVAILABLE ASSIGNMENT CONTROLLER                                                           *
 *********************************************************************************************/
function AvailableAssignmentsCtrl($scope) {
    
}

/*********************************************************************************************
 * EVENTS CONTROLLER                                                                         *
 *********************************************************************************************/
function EventsCtrl($scope, $ionicModal, EventSvc, RelationSvc) {

    $scope.state='';
    
    $scope.currentRelation = null;
    $scope.relations = null;

    $ionicModal.fromTemplateUrl('templates/create-event-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
        $scope.form = {
            type: "PublicWitnessing"
        };

        $scope.create = function () {
            $scope.showSpinner();
            var now = new Date();
            var offset = now.getTimezoneOffset();

            var event = {
                type: $scope.form.type,
                startTime: new Date(Date.parse($scope.form.date + 'T' + $scope.form.time) + (offset * 60000)),
                domain: $scope.currentRelation.domain
            };
            EventSvc.save(event).$promise.then($scope.load);
            $scope.closeModal();

        }
    });

    $scope.getDatesOfEvents = function () {
        var currentDate = null,
            eventDate, dates = [];
        angular.forEach($scope.events, function (event) {
            eventDate = new Date(event.startTime);
            if (currentDate === null || currentDate.toLocaleDateString() !== eventDate.toLocaleDateString()) {
                currentDate = eventDate;
                dates.push(currentDate);
            }
        });
        return dates;
    };

    $scope.openModal = function () {
        $scope.modal.show();
    };
    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    $scope.availableAssignments = function(event) {
        var count = 0;
        if(event.type === "PublicWitnessing") {
            angular.forEach(event.agendas, function(agenda) {
                angular.forEach(agenda.tasks, function(task) {
                    if(task.assignments.length < 2) {
                        count += (2 -task.assignments);
                    }
                });
            });
        }
        return count;
    }
    
    $scope.load = function () {
        $scope.showSpinner();
        $scope.relations = RelationSvc.query();
        $scope.relations.$promise.then(function () {
            
            if ($scope.relations.length > 0) {
                $scope.currentRelation = $scope.relations[0];
            } else {
                $scope.hideSpinner();
                $scope.$broadcast('scroll.refreshComplete');
            }
        });
    }

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });

    $scope.$watch('events.$resolved', function () {
        $scope.dates = $scope.getDatesOfEvents();
        
        if($scope.events && $scope.events.$resolved) {
            $scope.hideSpinner();
            $scope.$broadcast('scroll.refreshComplete');
        }
    });

    $scope.$watch('currentRelation', function () {
        if ($scope.currentRelation !== null) {
            $scope.events = EventSvc.query({
                domain: $scope.currentRelation.domain.id,
                mode: "full"
            });
        } else {
            $scope.events = null;
        }
    });

    $scope.load();

}

/*********************************************************************************************
 * EVENT EDIT CONTROLLER                                                                     *
 *********************************************************************************************/
function EventEditCtrl($scope, $stateParams, EventSvc, PersonSvc, $ionicPopup, $ionicModal, $filter) {
    $scope.load = function () {
        $scope.showSpinner();
        $scope.event = EventSvc.get({
            id: $stateParams.id,
            mode: 'full'
        });
        $scope.event.$promise.then(function () {
            $scope.hideSpinner();
            $scope.persons = PersonSvc.query({
                domain: $scope.event.domain.id
            });
        });
    }

    $ionicModal.fromTemplateUrl('templates/create-task-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });


    $scope.addAgenda = function () {
        $ionicPopup.prompt({
            title: 'Tilføj Agenda',
            //template: 'Indtast titel på ny Agenda',
            inputType: 'text',
            inputPlaceholder: 'Titel'
        }).then(function (title) {
            if (title) {
                var temp = angular.copy($scope.event);
                if(!temp.agendas) {
                    temp.agendas=[];
                }
                temp.agendas.push({
                    title: title
                });

                EventSvc.update({
                    id: $scope.event.id
                }, temp).$promise.then(function () {
                    $scope.event = temp;
                });
            }
        });
    }

    $scope.calNextAgendaStartTime = function (agenda) {
        var startTime = $scope.event.startTime;
        angular.forEach(agenda.tasks, function (task) {
            if (task.endTime.getTime() > startTime.getTime()) {
                startTime = new Date(task.endTime);
            }
        });
        return startTime;
    }

    $scope.addTask = function (agenda) {
        var temp = angular.copy($scope.event);
        $scope.currentEvent = $scope.event;
        $scope.event = temp;
        $scope.currentAgenda = agenda;
        $scope.taskForm = {
            type: "Witnessing",
            startTime: $filter('date')($scope.calNextAgendaStartTime(agenda), 'HH:mm'),
            endTime: $filter('date')($scope.calNextAgendaStartTime(agenda), 'HH:mm')
        };

        $scope.openModal();
    };

    $scope.createTask = function () {
        var now = new Date();
        var offset = now.getTimezoneOffset();
        var date = $filter('date')($scope.event.startTime, 'yyyy-MM-dd');
        var task = {
            type: $scope.taskForm.type,
            startTime: new Date(Date.parse(date + 'T' + $scope.taskForm.startTime) + (offset * 60000)),
            endTime: new Date(Date.parse(date + 'T' + $scope.taskForm.endTime) + (offset * 60000)),
            assignments: []
        };
        if ($scope.taskForm.conductor) {
            task.assignments.push({
                type: 'Conductor',
                assignee: $scope.taskForm.conductor
            })
        }

        if ($scope.taskForm.assistant) {
            task.assignments.push({
                type: 'Assistant',
                assignee: $scope.taskForm.assistant
            })
        }
        $scope.currentAgenda.tasks.push(task);
        EventSvc.update({
            id: $scope.currentEvent.id
        }, $scope.currentEvent).$promise.then($scope.load);
        $scope.closeModal();

    }

    $scope.openModal = function () {
        $scope.modal.show();
    };
    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    $scope.load();
}

/*********************************************************************************************
 * TASK EDIT CONTROLLER                                                                      *
 *********************************************************************************************/
function TaskEditCtrl($scope, $stateParams, EventSvc, PersonSvc) {
    $scope.load = function () {
        $scope.showSpinner();
        $scope.event = EventSvc.get({
            id: $stateParams.id,
            mode: 'full'
        });
        var agendaId = $stateParams.aid,
            taskId = $stateParams.tid;
        $scope.event.$promise.then(function () {
            $scope.hideSpinner();
            $scope.persons = PersonSvc.query({
                domain: $scope.event.domain.id
            });
            $scope.resolveTask(agendaId, taskId);
        });
    };

    $scope.resolveTask = function (agendaId, taskId) {
        angular.forEach($scope.event.agendas, function (agenda) {
            if (agenda.id === agendaId) {
                angular.forEach(agenda.tasks, function (task) {
                    if (task.id === taskId) {
                        $scope.task = task;
                    }
                });
            }
        });
    }

    $scope.load();
}

/*********************************************************************************************
 * PERSONS CONTROLLER                                                                        *
 *********************************************************************************************/
function PersonsCtrl($scope, PersonSvc, RelationSvc) {
    $scope.currentRelation = null;
    
    $scope.load = function() {
        $scope.showSpinner();
        $scope.relations = RelationSvc.query();
        $scope.relations.$promise.then(function () {
            $scope.hideSpinner();
            if ($scope.relations.length > 0) {
                $scope.currentRelation = $scope.relations[0];
            }
        });
    };


    $scope.$watch('currentRelation', function () {
        if ($scope.currentRelation !== null) {
            $scope.persons = PersonSvc.query({
                domain: $scope.currentRelation.domain.id
            });
        } else {
            $scope.persons = null;
        }
    });
    
    $scope.load();
}


/*********************************************************************************************
 * PERSON EDIT CONTROLLER                                                                    *
 *********************************************************************************************/
function PersonEditCtrl($scope, $stateParams, PersonSvc) {
    $scope.load = function() {
        $scope.showSpinner();
        $scope.person = PersonSvc.get({
            id: $stateParams.id
        });
        
        $scope.person.$promise.then(function() {
            $scope.hideSpinner();
        });
    };
    
    $scope.load();
}

/*********************************************************************************************
 * GROUPS CONTROLLER                                                                         *
 *********************************************************************************************/
function GroupsCtrl($scope) {

}

/*********************************************************************************************
 * GROUP EDIT CONTROLLER                                                                     *
 *********************************************************************************************/
function GroupEditCtrl($scope) {

}

/*********************************************************************************************
 * SAME DATE FILTER                                                                          *
 *********************************************************************************************/
function SameDateFilter() {
    return function (input, data) {
        if (!angular.isArray(input) ||
            !data ||
            !data.date) return input;

        if (!data.varName) {
            data.varName = 'date';
        }

        if (!angular.isObject(data.date)) {
            data.date = new Date(data.date);
        }

        var out = [],
            currentDate = null,
            result;
        angular.forEach(input, function (entry) {
            var entryDate = new Date(entry[data.varName]);

            if (typeof entryDate === 'object' && data.date.toLocaleDateString() === entryDate.toLocaleDateString()) {
                out.push(entry);
            }
        });

        return out;
    };
}

/*********************************************************************************************
 * CONTROLLER BOOTSTRAP                                                                      *
 *********************************************************************************************/
function ControllersBootstrap($rootScope, $ionicLoading) {
    $rootScope.showSpinner = function () {
        $rootScope.spinner = $ionicLoading.show({
            content: '<i class="ion-loading-c"></i> ',
            animation: 'fade-in',
            showBackdrop: false,
            showDelay: 400
        });
    };
    $rootScope.hideSpinner = function () {
        $ionicLoading.hide();
    };
}

/*********************************************************************************************
 * MODULE INITIALIZATION                                                                     *
 *********************************************************************************************/
angular.module('agendas.controllers', [])
    .controller('LoginCtrl', LoginCtrl)
    .controller('AssignmentsCtrl', AssigmentsCtrl)
    .controller('AssignmentEditCtrl', AssignmentEditCtrl)
    .controller('AvailableAssignmentsCtrl', AvailableAssignmentsCtrl)
    .controller('EventsCtrl', EventsCtrl)
    .controller('EventEditCtrl', EventEditCtrl)
    .controller('TaskEditCtrl', TaskEditCtrl)
    .controller('PersonsCtrl', PersonsCtrl)
    .controller('PersonEditCtrl', PersonEditCtrl)
    .controller('GroupsCtrl', GroupsCtrl)
    .controller('GroupEditCtrl', GroupEditCtrl)
    .filter('sameDate', SameDateFilter)
    .run(ControllersBootstrap);