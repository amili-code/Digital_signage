const express = require("express");
const router = express.Router();
const multer = require('multer');




const vidStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "videos");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

const picStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/pic");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})


const picUpload = multer({ storage: picStorage });
const vidUpload = multer({ storage: vidStorage });

const apiController = require("app/api");

router.post('/getVideo', vidUpload.single('vid'), apiController.getVideo.bind(apiController))
router.post('/delVideo', apiController.delVideo.bind(apiController))



module.exports = router;
