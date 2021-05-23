const express = require('express');
const log     = require('./mods/log');

// set up plain http server
const http = express();

// set up a route to redirect http to https
http.get('*', function(req, res) {  
    res.redirect('https://' + req.headers.host + req.url);

    // Or, if you don't want to automatically detect the domain name from the request header, you can hard code it:
    // res.redirect('https://example.com' + req.url);
})

// have it listen on 80
http.listen(80);

log.debug("Redirecting port 80 to https://");
