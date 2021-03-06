const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// Load Validation
const validatePostInput = require("../../validation/post");


// @route GET api/posts/test
// @desc Test posts route
// @access Public
router.get('/test', (req, res) => res.json({ msg: "Post Works" }));


// @route GET api/posts
// @desc Get all post
// @access Public

router.get('/', (req, res) => {
    Post.find()
        .sort({date: -1})
        .then(posts => {
            if(!posts){
                res.status(404).json('No posts');
            }
            res.json(posts);
        }).catch(err => res.status(404).json({ nopostfound: 'No posts found' }));
});


// @route GET api/posts/:id
// @desc Get post by id
// @access Public

router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            res.json(post);
        }).catch(err => res.status(404).json({nopostfound: 'No post found with that id'}));
});


// @route POST api/posts
// @desc Create post
// @access Private

router.post('/', passport.authenticate('jwt', {session: false}), (req,res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post)).catch(err => res.status(404).json(err));
})


// @route DELETE api/posts
// @desc Delete post
// @access Private

router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findOne({user: req.user.id})
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() !== req.user.id){
                        return res.status(401).json({notauthorized: 'User not authorized'});
                    }
                    // Delete
                    post.remove().then( () => res.json({success: true})).catch(err => res.status(404).json({postnotfound: 'Post not found'}));
                })
        }).catch(err => res.status(404).json({ postnotfound: 'Profile not found' }));
});

// @route POST api/posts/like/:id
// @desc Post like
// @access Private

router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
                        return res.status(400).json({ alreadyliked: 'User already like this post' });
                    }

                    // Add user id to the likes array
                    post.likes.unshift({ user: req.user.id });
                    post.save().then(post => res.json(post)).catch(err => res.status(404).json(err));

                }).catch(err => res.status(404).json({ postnotfound: 'Post not found'}))
        }).catch(err => res.status(404).json({ postnotfound: 'Post not found' }));
});

// @route POST api/posts/unlike/:id
// @desc Post unlike
// @access Private

router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                        return res.status(400).json({ notliked: 'You have not yet liked this post' });
                    }

                    // Get remove index
                    const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);

                    // Splice the array
                    post.likes.splice(removeIndex,1);

                    // Save
                    post.save().then(post => res.json(post)).catch(err => res.status(404).json(err));

                }).catch(err => res.status(404).json({ postnotfound: 'Post not found' }))
        }).catch(err => res.status(404).json({ postnotfound: 'Post not found' }));
});

// @route POST api/posts/comment/:id
// @desc Add comment to post
// @access Private

router.post( '/comment/:id', passport.authenticate('jwt', {session: false}), (req,res) => {

    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name: req.body.name,
                avatar: req.body.avatar,
                user: req.user.id,
            }

            // Add to comments array
            post.comments.unshift(newComment);
            // Save
            post.save().then(post => res.json(post));
        }).catch(err => res.status(404).json({postnotfound: 'No post found'}));
} );

// @route DELETE api/posts/comment/:id/:comment_id
// @desc Remove comments from post
// @access Private

router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {


    Post.findById(req.params.id)
        .then(post => {
            // Check if the comment exists
            if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){ // Comment does not exist
                return res.status(404).json( {commentdoesnotexist: 'Comment does not exist'});
            }

            // Get remove index
            const removeIndex = post.comments.map(comment => comment._id.toString()).indexOf(req.params.comment_id);

            // Remove from comments array
            post.comments.splice(removeIndex,1);

            // Save the comments
            post.save().then(post =>  res.json(post)).catch(err => res.status(404).json(err));
        }).catch(err => res.status(404).json({ postnotfound: 'No post found' }));
});

module.exports = router;