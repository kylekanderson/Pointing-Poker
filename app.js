/*
================================================================================================================
Back-End Javascript
================================================================================================================
*/
// various modules required by the express framework
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


//create an empty list of users
var users = {};

//create an empty list of votes
var votes = {};

/*
================================================================================================================
Socket Event Listeners
================================================================================================================
*/
io.on('connection', socket => {

    //when a new user connects...
    socket.on('new-user', name => {
        //add the name emitted from the client to the users list
        users[socket.id] = name;
        io.emit('user-connected', users);
    });

    //when a user votes...
    socket.on('send-vote', vote => {
        //add the vote emitted from the client to the votes list
        votes[socket.id] = vote;
        io.emit('vote', {vote: vote, user: users[socket.id]});
    });

    //when voting is finished, emit back the full votes list
    socket.on('voting-finished', () => {
        io.emit('voting-results', {votes: votes});
    })

    socket.on('disconnect', () => {
        //using broadcast here because the user that's disconnecting
        //doesn't need to receive this response from the server
        socket.broadcast.emit('user-disconnected', users[socket.id])
        //remove the disconnecting user from the user list
        delete users[socket.id]
    })

    socket.on('reset', () => {
        //when the reset signal is sent, empty the votes list
        votes = {};
        io.emit('reset-page');
    })
});



/*
================================================================================================================
View Engine Setup (stock express code)
================================================================================================================
*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  res.io = io;
  next();
});

app.use('/', indexRouter);

app.use('/favicon.ico', express.static('public/images/favicon.ico'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

/*
================================================================================================================
Error Handler (stock express code)
================================================================================================================
*/

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app: app, server: server};
