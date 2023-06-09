var express = require("express");
var router = express.Router();
require("../services/payouts.cron");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("FlowPay Backend");
});

module.exports = router;
