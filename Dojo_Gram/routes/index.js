var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
//Pre-load Posts:::
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);
  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});
router.param('user', function(req,  res, next, id) {
  var query = User.findById(id);
  query.exec(function (err, user){
    if (err) {return next(err); }
    if (!user) {return next(new Error('can\'t find user')); }
    req.user = user;
    return next();
  });
});
router.param('follower', function(req,  res, next, id) {
  var query = User.findById(id);
  query.exec(function (err, user){
    if (err) {return next(err); }
    if (!user) {return next(new Error('can\'t find user')); }
    req.follower = user;
    return next();
  });
});
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});
//Get Posts:::
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }
    res.json(posts);
  });
});
//Create Post:::
router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post._user = req.payload._id;
  post.author = req.payload.username;
  post.save(function(err, post){
    if(err){ return next(err); }
    User.findById(req.payload._id, function(err, user){
      if(err){return next(err);}
      user.posts.push(post);
      user.save(function(err, post) {
        if(err){ return next(err); }
      });
      res.json(post);
    });
  });
});
//Update Post with an UpVote:::
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});
//Create comment for single Post:::
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment._user = req.payload._id;
  console.log("REQ PAYLOAD", req);
  comment.author = req.payload.username;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});
//Get Comments for Single Post:::
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});
//Get Posts for Single User:::
router.get('/user/:user', function(req, res, next) {
  console.log("Got to User Route");
  req.user.populate('posts', function(err, posts) {
    if (err) { return next(err); }
    console.log("user posts:::", posts);
    res.json(posts);
  });
});
router.post('/user/:user/follow/:follower', function(req, res, next){
  console.log("Got to Follow Route!");
  if (req.user.followers.indexOf(req.follower._id) === -1){
    req.user.followers.push(req.follower);
    req.follower.following.push(req.user);
    req.user.save(function(err, user){
      if(err) { return next(err);}
      req.follower.save(function(err, user){
        if(err) { return next(err);}
      });
    });
  }
  else {
    req.user.followers = req.user.followers.filter(function(e) {
      req.follower.following = req.follower.following.filter(function(e) {
        req.user.save(function(err, user){
          if(err) { return next(err);}
          req.follower.save(function(err, user){
            if(err) { return next(err);}
          });
          console.log("AFTER REQ:::", req.params);
          console.log("AFTER REQ USER:::", req.user);
        });
      });
    });
  }
  res.json(user);
  });
//Update Comment with an UpVote:::
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  // console.log('Comment Upvote Req::', req.comment);
  req.comment.upvoteComment(function(err, comment){
    if (err) { console.log("ERRORRRRERRRORRRRERRRORRRRR"); return next(err); }

    res.json(comment);
  });
});
//Register User:::
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;
  user.setPassword(req.body.password)
  user.save(function (err){
    if(err){ console.log("ERRRRRRRRRRRRRRRROR"); return next(err); }

    return res.json({token: user.generateJWT()})
  });
});
//Login User:::
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
