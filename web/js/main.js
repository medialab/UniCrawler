function GlobalCtrl($scope) {
  $scope.error = false;
  
  // Reset all the GUI
  $scope.resetApp = function(){
    // TODO This doesn't work, we need to refresh or something
    $scope.seeds = [];
    $scope.working = 0;
    $scope.visited = 0;
    $scope.newSeed = '';
    $scope.newFilterAddress = '';
    $scope.newFilterTitle = '';
    $scope.newFilterContent = '';
    $scope.depth = '';
    $scope.filters = [];
  };
}

// Crawl status
function StatusCtrl($scope, $http, $timeout) {
  // Read with polling
  (function poll(){
    if(!$scope.retry){
      $scope.retry = 1000; 
    }
    $http.get(api_url + '/state').success(function(data) {
      $scope.$parent.error = false;
      $scope.working = data.working;
      $scope.visited = data.visited;
      $timeout(poll, $scope.retry);
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de récupérer l'état";
      console.error(data);
      $scope.retry *= 2;
      $timeout(poll, $scope.retry);
    });
  })();
}

// Seeds
function SeedCtrl($scope, $http) {
  // Get
  $http.get(api_url + '/seed').success(function(data) {
    $scope.$parent.error = false;
    $scope.seeds = data;
  }).error(function(data, status){
    $scope.$parent.error = "Impossible de récupérer les seed";
    console.error(data);
  });
  
  // Add
  $scope.addSeed = function() {
    if(!$scope.newSeed) return;
    if($scope.newSeed.match(/^https?:\/\//) == null){
      $scope.newSeed = "http://" + $scope.newSeed;
    }
    var postData = { url: $scope.newSeed };
    $http.post(api_url + '/seed', postData).success(function(data) {
      $scope.$parent.error = false;
      $scope.seeds.push($scope.newSeed);
      $scope.newSeed = "";
    }).error(function(data, status){
      $scope.$parent.error = "Impossible d'ajouter le seed";
      console.error(data);      
    });
  };

  // Delete
  $scope.deleteSeed = function(index) {
    var data = { url: $scope.seeds[index] };
    $http.delete(api_url + '/seed', {params: data}).success(function(data) {
      $scope.$parent.error = false;
      $scope.seeds.splice(index, 1);
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de supprimer le seed";
      console.error(data);      
    });
  };
}

// Profondeur
function DepthCtrl($scope, $http) {
  // Get
  $http.get(api_url + '/depth').success(function(data) {
    $scope.$parent.error = false;
    $scope.depth = data.depth;
  }).error(function(data, status){
    $scope.$parent.error = "Impossible de récupérer la profondeur";
    console.error(data);
  });
  
  // Save
  $scope.DepthSet = function(){
    var postData = { depth: $scope.depth };
    $http.post(api_url + '/depth', postData).success(function(data) {
      $scope.$parent.error = false;
      $scope.depth = postData.depth;
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de sauvegarder la profondeur";
      console.error(data);
    });
  };
}

// Filters
function FilterCtrl($scope, $http) {
  // Get
  $http.get(api_url + '/filter').success(function(data) {
    $scope.$parent.error = false;
    $scope.filters = data;
  }).error(function(data, status){
    $scope.$parent.error = "Impossible de récupérer les filtres";
    console.error(data);
  });
  
  // Add
  $scope.addFilter = function(target) {
    var val = $scope.newFilterData[target];
    if(!val) return;
    var postData = { keyword: val, target: target };
    $http.post(api_url + '/filter', postData).success(function(data) {
      $scope.$parent.error = false;
      $scope.filters[target].push(val);
      $scope.newFilterData[target] = "";
    }).error(function(data, status){
      $scope.$parent.error = "Impossible d'ajouter le " + target;
      console.error(data);      
    });
  };
  
  $scope.newFilterData = {
    url: "",
    title: "",
    body: ""
  };
  
  // Delete
  $scope.deleteFilter = function(target, index) {
    var data = { keyword: $scope.filters[target][index], target: target };
    $http.delete(api_url + '/filter', { params: data }).success(function(data) {
      $scope.$parent.error = false;
      $scope.filters[target].splice(index, 1);
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de supprimer le " + target;
      console.error(data);
    });
  };
}

// Control buttons
function ButtonsCtrl($scope, $http) {
  // Start
  $scope.startCrawl = function(index) {
    $http.post(api_url + '/start').success(function(data) {
      $scope.$parent.error = false;
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de démarrer le crawl";
      console.error(data);
    });
  };
  
  // Stop
  $scope.stopCrawl = function(index) {
    $http.post(api_url + '/stop').success(function(data) {
      $scope.$parent.error = false;
    }).error(function(data, status){
      $scope.$parent.error = "Impossible d'arrêter le crawl";
      console.error(data);
    });
  };
  
  // Reset
  $scope.resetCrawl = function(index) {
    var type;
    if($scope.resetData && $scope.restSettings) type = 0;
    else if($scope.resetData && !$scope.resetSettings) type = 1;
    else if(!$scope.resetData && $scope.resetSettings) type = 2;
    else return;
    
    $http.post(api_url + '/reset', { type: type }).success(function(data) {
      if($scope.resetSettings){
        $scope.$parent.resetApp();
      }
      $scope.$parent.error = false;
    }).error(function(data, status){
      $scope.$parent.error = "Impossible de réinitialiser le crawl";
      console.error(data);
    });
  };
}

String.prototype.hashColor = function(){
  var hash = 0;
  if (this.length == 0) return hash;
  for (i = 0; i < this.length; i++) {
      char = this.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash;
  }
  if(hash < 0) hash *= -1;
  hash %= 16777215;
  hash = hash.toString(16);
  return hash.length < 6 ? new Array(6 - hash.length + 1).join('0') + hash : hash;
}

var sigInst;

function SigmaCtrl($scope, $http, $timeout) {
  // Instanciate sigma.js and customize it :
  sigInst = sigma.init(document.getElementById('sigma')).drawingProperties({
    defaultLabelColor: '#fff',
    defaultLabelSize: 14,
    defaultLabelBGColor: '#fff',
    defaultLabelHoverColor: '#000',
    labelThreshold: 6,
    defaultEdgeType: 'curve'
  }).graphProperties({
    minNodeSize: 0.5,
    maxNodeSize: 5,
    minEdgeSize: 1,
    maxEdgeSize: 1
  }).mouseProperties({
    maxRatio: 4
  });
  
  $http.get('test-data.json').success(function(data) {
    $scope.$parent.error = false;
    //$scope.jsonData = data;
    
    // Create all the nodes
    var nodeList = {};
    for(var node in data){
      nodeList[data[node]._id] = 1;
      var l = document.createElement("a");
      l.href = data[node]._id;
      sigInst.addNode(data[node]._id, {
        label: l.href,
        x: Math.random(),
        y: Math.random(),
        color: l.hostname.hashColor(),
        size: 0.8
      });
    }    
    
    // Create the edges
    var i = 0;
    for(var node in data){
      for(var link in data[node].links){
        if(nodeList[data[node].links[link]]){
          sigInst.addEdge(i++, data[node]._id, data[node].links[link]);          
        }
      }
    }
    
    /*sigInst.startForceAtlas2();
    $timeout(sigInst.stopForceAtlas2, 7000);*/
    
  }).error(function(data, status){
    $scope.$parent.error = "Impossible de récupérer les données";
    console.error(data);
  });
}
    