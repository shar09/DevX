const express = require('express');
const router = express.Router();

// @test   GET api/users
// @desc   test
// @access public

router.get("/", (req, res) => res.send('User Route'));

module.exports = router;