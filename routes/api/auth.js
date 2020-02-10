const express = require('express');
const router = express.Router();

// @test   GET api/auth
// @desc   test
// @access public

router.get("/", (req, res) => res.send('Auth Route'));

module.exports = router;