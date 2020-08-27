const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/profile');
const User = require('../../models/user');

// @route  GET api/profile/me
// @desc   get current users profile
// @access private

router.get("/me", auth, async (req, res) => {  
    try {
        const profile = await Profile.findOne({ user : req.user.id }).populate(
          'name',
          ['name', 'avatar']
        ); 
        if(!profile) {
            res.status(400).json({msg: 'there is no profile for this user'});
        }
        
        res.json(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
    
    // res.send('Profile Route')
});

// @route  POST api/profile/
// @desc   post profile information
// @access private

router.post("/", 
    [ auth,
    [ check('status', 'Status is required')
      .not()
      .isEmpty(),
      check('skills', 'Skills is required')
      .not()
      .isEmpty()
    ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            console.log(errors);
            console.log(errors.array());
            res.status(400).json({ errors: errors.array() });
        }
    
        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            linkedin,
            twitter
        } = req.body;

        // Build profile fields
        const profileFields = {};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(status) profileFields.status = status;
        if(bio) profileFields.bio = bio;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // Build social fields
        profileFields.social = {};
        if(linkedin) profileFields.social.linkedin = linkedin;
        if(twitter) profileFields.social.twitter = twitter;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if(profile) {
                //update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                )
                return res.json(profile);
            }
            
            //create
            profile = new Profile(profileFields);

            await profile.save();
            res.json(profile);
            
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');            
        }

    }
);

// @route  GET api/profile/
// @desc   get all profiles
// @access public

router.get("/", async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  GET api/profile/:user_id
// @desc   get profile by userid
// @access public

router.get("/user/:user_id", async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        if(err.kind === 'ObjectId') {
            res.status(400).json({ msg: 'Profile not found' });
        }
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  DELETE api/profile/
// @desc   delete profile, users and posts based on token
// @access private

router.delete("/", auth, async(req, res) => {
   //@todo - remove users posts 

    try {
        // Delete profile
        await Profile.findOneAndRemove({ user: req.user.id });
        
        // Remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted'});
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  PUT api/profile/experience
// @desc   add profile experience
// @access private

router.put('/experience', [auth, 
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty()
        ]
    ],   
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExperience = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }
    
        try {
          const profile = await Profile.findOne({ user: req.user.id});

          profile.experience.unshift(newExperience);

          await profile.save();

          res.json(profile);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route  DELETE api/profile/experience/:exp_id
// @desc   delete profile expereience
// @access private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
    
});

// @route  PUT api/profile/education
// @desc   add profile education
// @access private

router.put('/education', [auth, 
    [
        check('school', 'School is required').not().isEmpty(),
        check('degree', 'Degree is required').not().isEmpty(),
        check('fieldofstudy', 'Field of study is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]
],   
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEducation = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id});

      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  DELETE api/profile/experience/:edu_id
// @desc   delete profile education
// @access private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        //Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  GET api/profile/github/:username
// @desc   get the user repos from github
// @access public

router.get('/github/:username', (req, res) => {
    axios.get(`https://api.github.com/users/${req.params.username}/repos?per_page=5
    &sort=created:asc&client_id=${config.get('githubClientId')}
    &client_secret=${config.get('githubSecret')}`)
    .then(response => {
        if(response.status !== 200) {
            res.status(400).json({ msg: 'No github profile found' });
        }
        res.json(response.data);
    })
    .catch(err => {
        console.log(err.message);
        res.status(500).send('Server Error');
    });
});

module.exports = router;