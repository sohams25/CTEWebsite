const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const logger = require('morgan');
const passport = require('passport');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Custom
const googleAuth = require('./controllers/googleAuth');

// Routes
const viewsRouter = require('./controllers/routes/views');
const authRouter = require('./controllers/routes/auth');
const coursesRouter = require('./controllers/routes/courses');
const adminRouter = require('./controllers/routes/admin');
const apiRouter = require('./controllers/routes/api');

// Configure environment variables
require('dotenv').config()

// Connect to database
mongoose.connect('mongodb://localhost:27017/cte-dev', { useNewUrlParser: true });

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(sassMiddleware({
	src: path.join(__dirname, 'public'),
	dest: path.join(__dirname, 'public'),
	indentedSyntax: false, // true = .sass and false = .scss
	sourceMap: true
}));
app.use(logger('dev'));
// app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
	secret:  '!P+@3D7x&rW#G%m',
	resave: true,
    saveUninitialized: true
}))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: true
}));

// parse requests of content-type - application/json
app.use(bodyParser.json());

app.use(passport.initialize())
app.use(passport.session())

// Initialize Google Auth
googleAuth(passport);

if (process.env.NODE_ENV !== "production") {
	app.use((req, res, next) => {
		req.session.passport= {
			user: '5d244ff77d92f15ad81fd99c'
		}
		return next();
	});
}

// Routes
app.use('/', viewsRouter);
app.use('/auth', authRouter);
app.use('/courses', coursesRouter);
app.use('/admin', adminRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API
app.use('/api', apiRouter);
// Admin App
app.use('/dashboard', express.static(path.join(__dirname, 'client', 'dashboard', 'dist' )));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json( {
		error: err.message
	});
});

module.exports = app;