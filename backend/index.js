const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const http = require('http');

app.use(cors({
    origin: '*'
}));
 
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

const usersRoute = require('./routes/userRoute');
const leadsRoute = require('./routes/leadsRoute');
const campanhasRoute = require('./routes/campanhasRoute');
const instanciasRoute = require('./routes/instanciasRoute');

app.use('/users', usersRoute);
app.use('/leads', leadsRoute);
app.use('/campanhas', campanhasRoute);
app.use('/instancias', instanciasRoute);

if(process.env.DEVELOPMENT_MODE == "true"){
    var httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT);
}else{
    var httpServer = http.createServer(app);
    httpServer.listen(process.env.PORT);
}