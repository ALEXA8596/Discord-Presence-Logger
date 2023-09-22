const express = require('express');
const app = express();
const { fetch } = require('undici');

module.exports = (port) => {
    app.set("view engine", "ejs");	

    app.get('/timezone/:timezone', async (req, res) => {
        // console.log(req.params);
        fetch('https://worldtimeapi.org/api/timezone/' + req.params.timezone)
            .then(res => res.json())
            .then(json => {
                res.json(json);
            });
    });

    // return an image slider of before and after images
    app.get('/slider', async (req, res) => {
        res.render("slider", { before: req.query.before, after: req.query.after });
    });

    app.listen(port, () => {
        console.log(`Express server listening on port ${port}`);
    });
}