const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const normalize = require('normalize-url');
const config = require('config');
const User = require('../../models/user');

// @route   POST api/users
// @desc   Register User
// @access public

router.post("/", [
    check('name', 'name is required').not().isEmpty(),
    check('email','Enter a valid email').isEmail(),
    check('password', 'Password needs to be more than six characters').isLength( {min: 6} ),
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {name, email, password} = req.body;
    
    try {      
        // see if users exist
        let user = await User.findOne({ email });
        if(user) {
            return res.status(400).json({errors: [{msg: "User already exists"}] });
        }

        // get users gravatar
        const avatar = normalize(
            gravatar.url(email, {
              s: '200',
              r: 'pg',
              d: 'mm'
            }),
            { forceHttps: true }
        );

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //saves to database
        await user.save();

        // return jsonwebtoken - to login right after registration, authorize routes
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

        // res.send('User Registered');
    }
    catch(err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }    
});

module.exports = router;