const express = require('express');
const router = express.Router();

// @test   GET api/posts
// @desc   test
// @access public

router.get("/", (req, res) => res.send('Posts Route'));

module.exports = router;