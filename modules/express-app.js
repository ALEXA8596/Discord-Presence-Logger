const express = require('express');
const app = express();
const { fetch } = require('undici');

module.exports = (port) => {
    app.get('/timezone/:timezone', async (req, res) => {
        // console.log(req.params);
        fetch('https://worldtimeapi.org/api/timezone/' + req.params.timezone)
            .then(res => res.json())
            .then(json => {
                res.json(json);
            });
    });
    app.listen(port, () => {
        console.log(`Express server listening on port ${port}`);
    });
}