// this is our friends.js file located at /server/controllers/friends.js
// note the immediate function and the object that is returned
var mongoose = require('mongoose');
var Friend = mongoose.model('Friend');
module.exports = (function() {
 return {
  index: function(req, res) {
     Friend.find({}, function(err, results) {
       if(err) {
         console.log(err);
       } else {
         res.json(results);
       }
   })
  },
  //Takes req.body stuff and saves to database, then redirects back to /friends which executes getFriends immediately repopulating
  //friend list.
  addfriend: function(req, res) {
  	var new_friend = new Friend({name: req.body.name, age: req.body.age});
  	console.log("DA BODYYY", new_friend)
  	new_friend.save(function(err, data){
  		console.log(data);
  		if(err){
  			console.log(err);
  			console.log("Error saving new friend!");
  		} else {
  			res.redirect('/friends');
  		}
  	})
  },
		deletefriend: function (req, res){
			console.log(req.body._id);
			Friend.remove({_id: req.body._id}, function(err, data){
				if(err){
					console.log(err);
					console.log('\nError removing Friend!');
				} else {
					res.redirect('/friends');
				}
			})
		}
	}
})();