var mongoose = require('mongoose');
var fs = require('fs');


var PostSchema = new mongoose.Schema({
  author: String,
  title: String,
  img: String,
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  _user: {type: mongoose.Schema.ObjectId, ref: 'User'},
  created_at: Date,

});
PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

mongoose.model('Post', PostSchema);
