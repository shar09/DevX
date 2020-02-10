const express = require('express');
const router = express.Router();

// @test   GET api/profile
// @desc   test
// @access public

router.get("/", (req, res) => res.send('Profile Route'));

module.exports = router;