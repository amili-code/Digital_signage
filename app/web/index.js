const jwt = require("jsonwebtoken");

class web {
    example(req, res) {
        res.render("example", {  })
    }
}


module.exports = new web();