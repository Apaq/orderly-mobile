
function AgendasProvider() {
    'use strict';
    /* SERVICEURL START */
    var serviceUrl = "http://192.168.87.114:8080/";
    /* SERVICEURL END */

    this.setServiceUrl = function (url) {
        serviceUrl = url;
    };
    
    this.convertDateStringsToDates = function(keys, data) {
        var key, value, i;    
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                if (keys.indexOf(key) >= 0 && angular.isString(data[key])) {
                    value = Date.parse(data[key]); // try to parse to date
                    if (value !== NaN) {
                        data[key] = new Date(value); 
                    }
                }
                
                if(angular.isObject(data[key])) {
                    this.convertDateStringsToDates(keys, data[key]);
                }
                
                if(angular.isArray(data[key])) {
                    for(i=0;i<data[key].length;i++) {
                        this.convertDateStringsToDates(keys, data[key][i]);
                    }
                }
            }
        }
    };

    this.$get = function () {
        return {
            getServiceUrl: function () {
                return serviceUrl;
            },
            setServiceUrl: function(url) {
                serviceUrl = url;
            },
            getLanguageNames: function() {
                return languageNames;
            }
        };
    };
    
    
}

function PersonSvc($resource, agendas) {
    return $resource(agendas.getServiceUrl() + 'persons/:id');
}

function AssignmentSvc($resource, agendas) {
    return $resource(agendas.getServiceUrl() + 'persons/:pid/assignments/:id');
}

function EventSvc($resource, agendas) {
    return $resource(agendas.getServiceUrl() + 'events/:id', null, {
           'update': { method:'PUT' }
       });
}

function DomainSvc($resource, agendas) {
    return $resource(agendas.getServiceUrl() + 'domains/:id');
}

function RelationSvc($resource, agendas) {
    return $resource(agendas.getServiceUrl() + 'persons/current/relations');
}

function LoginSvc($q, localStorageService, $http, $rootScope, agendas, $log) {
    'use strict'
    var currentUser = null;
    return {
        authenticate: function(username, password, remember) {

            var user = null, authHeader, token;

            if(!username && !password) {
                token = localStorageService.get('LoginToken');
            } else if(username && password) {
                token = btoa(username + ':' + password);
            }

            if(token) {
                authHeader = 'Basic ' + token;
                return $http.get(agendas.getServiceUrl() + "persons/current", {headers: {'Authorization': authHeader}}).then(function(response) {
                    if(response.status !== 200) {
                        var reason = response.data;
                        if(!reason || '' === reason) {
                            reason = 'Unable to communicate with server';
                        }
                        localStorageService.remove('LoginToken');
                        console.info('Unable to authenticate: ' + reason.message);
                        return $q.reject('Unable to authenticate. Reason: ' + reason.message);
                    }

                    if(remember) {
                        localStorageService.add('LoginToken', token);
                    }

                    $rootScope.credentials = {username: username, password: password};
                    user = response.data;

                    $log.info('Authenticated. Returning user.');
                    $http.defaults.headers.common['Authorization'] = authHeader;

                    $log.info('Logged in as ' + user.username);
                    currentUser = user;
                    $rootScope.currentUser = user;
                    $rootScope.$broadcast("login", user);
                    return user;
                });
            } else {
                console.info('Unable to authenticate.');
                return $q.reject('No credentials specified or available for authentication.');
            }

        },
        getCurrentUser: function() {
            return currentUser;
        },
        deauthenticate: function() {
            $http.defaults.headers.common['Authorization'] = undefined;
            localStorageService.remove('LoginToken');
            $rootScope.$broadcast("logout", currentUser);
            currentUser = null;
            $rootScope.currentUser = null;
        }
    }
};


angular.module('agendas.services', ['ngResource', 'LocalStorageModule'])
.provider('agendas', AgendasProvider)
.factory({
    'PersonSvc': PersonSvc,
    'AssignmentSvc': AssignmentSvc,
    'EventSvc': EventSvc,
    'LoginSvc': LoginSvc,
    'RelationSvc': RelationSvc
 });
