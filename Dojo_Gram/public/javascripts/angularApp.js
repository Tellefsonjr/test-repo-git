var app = angular.module('dojoGram', ["ui.router", "ui.bootstrap"]);
//Routing:::
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
  .state('home', {
  url: '/home',
  templateUrl: '../partials/home.html',
  controller: 'MainCtrl',
  resolve: {
    postPromise: ['posts', function(posts){
      return posts.getAll();
    }]
  }
})
  .state('profile', {
    url: '/user/{id}',
    templateUrl: '../partials/user.html',
    controller: 'ProfileCtrl',
    resolve: {
      post: ['$stateParams', 'members', function($stateParams, members){
        return members.getAllUserPosts($stateParams.id);
      }]
    }
  })
  .state('followers', {
    url:'/user/{id}/followers',
    templateUrl:'../partials/followers.html',
    controller: 'ProfileCtrl',
    resolve: {
      post: ['$stateParams', 'members', function($stateParams, members){
        return members.getFollowers($stateParams.id);
      }]
    }
  })
  .state('following', {
    url:'/user/{id}/following',
    templateUrl:'../partials/following.html',
    controller: 'ProfileCtrl',
    resolve: {
      post: ['$stateParams', 'members', function($stateParams, members){
        return members.getFollowing($stateParams.id);
      }]
    }
  })
  .state('posts', {
    url: '/posts/{id}',
    templateUrl: '../partials/posts.html',
    controller: 'PostsCtrl',
    resolve: {
      post: ['$stateParams', 'posts', function($stateParams, posts) {
        return posts.get($stateParams.id);
      }]
    }
})
  .state('upload', {
    url: '/upload/{id}',
    templateUrl: '../partials/upload.html',
    controller: 'UploadCtrl',
    resolve: {
      post: ['$stateParams', 'members', function($stateParams, members){
        return members.getAllUserPosts($stateParams.id);
      }]
    }
  })
    .state('settings', {
      url: '/user/{id}/settings',
      templateUrl: '../partials/settings.html',
      controller: 'ProfileCtrl',
      resolve: {
        post: ['$stateParams', 'members', function($stateParams, members){
          return members.getAllUserPosts($stateParams.id);
        }]
      }
    })
    .state('login', {
        url: '/login',
        templateUrl: '../partials/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth) {
          if (auth.isLoggedIn()) {
            $state.go('home');
          }
        }]
      })
      .state('register', {
          url: '/register',
          templateUrl: '../partials/register.html',
          controller: 'AuthCtrl',
          onEnter: ['$state', 'auth', function($state, auth) {
            if (auth.isLoggedIn()) {
              $state.go('home');
            }
          }]
});

  $urlRouterProvider.otherwise('home');
}]);


//Auth Factory:::
app.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};
   auth.saveToken = function (token){
     $window.localStorage['flapper-news-token'] = token;
   };

   auth.getToken = function (){
     return $window.localStorage['flapper-news-token'];
   };
   auth.isLoggedIn = function(){
  var token = auth.getToken();

  if(token){
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.exp > Date.now() / 1000;
  } else {
    return false;
  }
};
auth.currentUserID = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload._id;
  }
};
auth.currentUser = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.username;
  }
};
auth.register = function(user){
  return $http.post('/register', user).success(function(data){
    auth.saveToken(data.token);
  });
};
auth.logIn = function(user){
  return $http.post('/login', user).success(function(data){
    auth.saveToken(data.token);
  });
};
auth.logOut = function(){
  $window.localStorage.removeItem('flapper-news-token');
};
  return auth;
}]);


//Posts Factory:::
app.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: [{title: 'hello', upvotes:0}]
  };
  o.getAll = function() {
   return $http.get('/posts').success(function(data){
     angular.copy(data, o.posts);
   });
 };
  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
    });
  };
  o.create = function(post) {
    console.log("o.create:", post);
    return $http.post('/posts', post, {
      headers:  {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };

  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.upvotes += 1;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.upvotes += 1;
    });
  };
return o;
}]);
//members Factory:::
app.factory('members', ['$http', 'auth', function($http, auth){
  var o = {
    posts: [{title: 'hello', upvotes:0}],
    users: []
  };
  o.editProfile = function(user_repack) {
    console.log("EDIT PROFILE USER:", user_repack);
    return $http.patch('/user/' + user_repack._id + '/edit', user_repack).success(function(data){
      headers: {Authorization: 'Bearer '+auth.getToken()}
    })
  }
  o.getAllUserPosts = function(id) {
    return $http.get('/user/' + id).success(function(data){
      console.log("Got to $HTTP in User Factory!!!", data);
      angular.copy(data, o.posts);
    });
  };
  o.followUser = function(id, follower){
    return $http.post('/user/' + id + '/follow/' + follower, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };
  o.unfollowUser = function(id, follower){
    console.log(id, follower);
    return $http.post('/user/' + id + '/unfollow/' + follower, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };
  o.getFollowing = function(id){
    return $http.get('/user/' + id + '/following').success(function(data){
      angular.copy(data, o.users);
    });
  };
  o.getFollowers = function(id){
    return $http.get('/user/' + id + '/followers').success(function(data){
      angular.copy(data, o.users);
    });
  };
return o;
}]);
//Posts Controller:::
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){
  $scope.posts = posts;
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUserID = auth.currentUserID;

//Add Comment:::
$scope.addComment = function() {
  if ($scope.body === '') {
    return;
  }
  posts.addComment(post._id, {
    body: $scope.body,
    author: 'users',
  }).success(function(comment) {
    console.log(comment.author);
    $scope.post.comments.push(comment);
  });
  $scope.body = '';
};
$scope.addPost = function(){
  if(!$scope.title || $scope.title === '') { return; }
    var post_repack = {
      title: $scope.title,
      img: $scope.img,
    };
    console.log("post_repack:", post_repack);
  posts.create(post_repack);
  $scope.title = '';
  $scope.img = '';
};
$scope.incrementUpvotes = function(comment){
  console.log("UPVOTE", comment);
  posts.upvoteComment(post, comment);
};
}]);
//Main Controller:::
app.controller('MainCtrl', [
'$scope',
'posts',
'auth',
'$http',
function($scope, posts, auth){
  $scope.posts = [];
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUserID = auth.currentUserID;


  $scope.addPost = function(){
    if(!$scope.title || $scope.title === '') { return; }
      var post_repack = {
        title: $scope.title,
        img: $scope.img,
      };
      console.log("post_repack:", post_repack);
    posts.create(post_repack);
    $scope.title = '';
    $scope.img = '';
  };


  $scope.incrementUpvotes = function(post) {
    posts.upvote(post);
  };

}]);
//Profile Controller:::
app.controller('ProfileCtrl', [
'$scope',
'$state',
'posts',
'post',
'auth',
'members',
function($scope, $state, posts, post, auth, members){
  $scope.user = members.posts;
  $scope.users = members.users;
  $scope.currentUser = auth.currentUser;
  $scope.posts = members.posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUserID = auth.currentUserID;

  $scope.editProfile = function(user) {
    console.log("UZOR:", user);
    user_repack = {
      _id: user._id,
      username: user.newUsername,
      bio: user.newBio,
      password: user.newPassword,
    };
    console.log("USER_REPACK", user_repack);
    members.editProfile(user_repack).success(function(data) {
      console.log("EDIT PROFILE POST DATA:", data);
      $scope.user = data.user;
    });
  };
  $scope.incrementUpvotes = function(post) {
    posts.upvote(post);
  };
  $scope.followUser = function(id, follower) {
    members.followUser(id, follower).success(function(id, follower){
      console.log("SCOPE USER FOLLOWING", $scope.user.following);
      $scope.user.followers.push(follower);
      $state.reload('profile');
    });
  };
  $scope.unfollowUser = function(id, follower) {
    members.unfollowUser(id, follower).success(function(id, follower){
      $scope.user.followers = $scope.user.followers.filter(function(e){
        $state.reload('profile');
      });
    });
  };
  $scope.isFollowing = function(){
    if($scope.user.followers.indexOf(auth.currentUserID()) === 0){
      return true;
    };
  };

}]);
//Upload Controller:::
app.controller('UploadCtrl', [
'$scope',
'$state',
'posts',
'post',
'auth',
'members',
function($scope, $state, posts, post, auth, members){
  console.log("MEMBERS::", members);
  $scope.user = members.posts.username;
  $scope.currentUser = auth.currentUser;
  $scope.posts = members.posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUserID = auth.currentUserID;
  $scope.upload = function(){
    if(!$scope.title || $scope.title === '') { return; }
      var post_repack = {
        title: $scope.title,
        img: $scope.img,
      };
    posts.create(post_repack).then(function(){
      $scope.posts.push(post_repack);
      $state.reload('profile');
    });
    $scope.title = '';
    $scope.img = '';
  };


  $scope.incrementUpvotes = function(post) {
    posts.upvote(post);
  };

}]);
//Auth Controller:::
app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}]);
//Navigation Controller
app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.currentUserID = auth.currentUserID;
  $scope.logOut = auth.logOut;
}]);
