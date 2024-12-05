const express = require("express");
const router = express.Router(); //suur "R" on oluline!!!
const general = require("../generalFnc");

//kõikidele marsruutidele ühine vahevara (middleware)
router.use(general.checkLogin);

//kontrollerid
const {
	galleryOpenPage} = require("../controllers/galleryControllers");

//igale marsruudile oma osa nagu seni index failis

router.route("/").get(galleryOpenPage);

module.exports = router;