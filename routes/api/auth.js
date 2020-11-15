const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route  GET api/auth
// @desc   to check if user is authorized
// @access Private

// to get user info
router.get("/", auth, async (req, res) => {
    try {
        // req.user set in middleware - returns DECODED: 
        // {
        //     user: { id: '5f419a4ef83e2a98aa754749' },
        //     iat: 1598134862,
        //     exp: 1598494862
        //   }
        const user = await User.findById(req.user.id).select('-password');
        // returned value in user {
        //     "_id": "5f419a4ef83e2a98aa754749",
        //     "name": "Sharath",
        //     "email": "sharathtelu9@gmail.com",
        //     "avatar": "//www.gravatar.com/avatar/27e4244de4f10b638c49bd72078f666d?s=200&r=pg&d=mm",
        //     "date": "2020-08-22T22:21:02.768Z",
        //     "__v": 0
        // }
        res.json(user);
    }
    catch(err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
    // res.send('Auth Route')
});

// @route  POST api/auth
// @desc   Authenticate User and get token
// @access Public

// to login
router.post("/", [
    check('email','Enter a valid email').isEmail(),
    check('password', 'Password is required').exists(),
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json( {errors: errors.array() } );
    }
    const {email, password} = req.body;
    
    try {      
        // see if users exist
        let user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({errors:  [{msg: "Invalid credentials"}] });
        }

        const isMatch = await bcrypt.compare(password, user.password)
        
        if(!isMatch) {
            return res.status(400).json({errors:  [{msg: "Invalid credentials"}] });
        }

        // return jsonwebtoken - authorize routes
        const payload = {
            user: {
                id: user.id
            }
        }
        
        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
               if(err) throw err;
               res.json({ token });
            } 
        );
    }
    catch(err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }    
});

module.exports = router;