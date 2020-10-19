const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/post');
const User = require('../../models/user');

// @route  POST api/posts
// @desc   Create a post
// @access private

router.post("/", [ [
        check('text', 'Comment is required').not().isEmpty(),
    ],
    auth ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
           return res.status(401).json({ msg: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');

            const postContent = {
                user: req.user.id,
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
            }

            const post = new Post(postContent);

            await post.save();

            res.json(post);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }
    }
); 

// @route  GET api/posts
// @desc   Get all posts
// @access private

router.get('/', auth, async (req, res) => {
    try {    
        const user = await User.findById(req.user.id).select('-password');

        if(!user) {
            return res.status(401).send('Authorization token invalid');
        }

        const posts = await Post.find().sort({ date : -1});
        
        res.json(posts);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route  GET api/posts/:id
// @desc   Get post by id
// @access private

router.get('/:id', auth, async (req, res) => {
    try {    
        const user = await User.findById(req.user.id).select('-password');

        if(!user) {
            return res.status(401).send('Authorization token invalid');
        }

        const post = await Post.findById(req.params.id);
        
        res.json(post);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route  DELETE api/posts/:id
// @desc   Get all posts
// @access private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); 
        if(!post) {
            res.status(404).json({ msg: 'Post does not exist' });
        }

        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg : 'Token authorization denied' });
        }

        await post.remove();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route  PUT api/posts/like/:id
// @desc   Add likes on posts
// @access private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({ msg: 'Post does not exist' });
        }
        
        const users = post.likes.map(like => like.user);

        if(users.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Post already liked'});
        }
        post.likes.unshift({ user: req.user.id });
        
        await post.save();

        res.json(post.likes);

    } catch (err) {
       console.log(err.message);
       res.status(500).send('Server error');
    }
});

// @route  PUT api/posts/unlike/:id
// @desc   Remove likes on posts
// @access private

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({ msg: 'Post does not exist' });
        }

        const users = post.likes.map(like => like.user);

        if(!users.includes(req.user.id)) {
            return res.status(401).json({ msg: 'Post has not been liked'});
        }
    
        const removeIndex = post.likes.map(like => like.user).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();
    
        res.json(post.likes);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route  PUT api/posts/comments/:id
// @desc   Add comment on posts
// @access private

router.post("/comments/:id", [ [
        check('text', 'Comment is required').not().isEmpty(),
    ],
    auth ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(401).json({ msg: errors.array() });
        }
        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);

            const postComment = {
                user: req.user.id,
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
            }

            post.comments.unshift(postComment);

            await post.save();

            res.json(post.comments);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }
    }
); 

// @route  DELETE api/posts/comments/:id/:comment_id
// @desc   Remove comments on posts
// @access private

router.delete('/comments/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({ msg: 'Post does not exist' });
        }
    
        const removeIndex = post.comments.map(comment => comment.id).indexOf(req.params.comment_id);
        // console.log("remove index: ",removeIndex);
        
        if(post.comments[removeIndex].user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        post.comments.splice(removeIndex, 1);

        await post.save();
    
        res.json(post.comments);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;