var express = require("express");

var app = express();

var PORT = process.env.PORT || 8000;

var Sighting = require("./Sighting.js");
var bodyParser = require('body-parser');
var session = require('express-session');

var sightings = [];
function oldSighting(arr){
	return arr.timestamp > (Date.now() - 600000);
}
setInterval(function(){
	sightings = sightings.filter(oldSighting);
}, 60000);

var UserFtns = require("./UserFtns.js");

app.use(function(req, res, next){
	console.log(req.url);
	next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(session({
	secret: "lol pokemon",
	resave: false,
	saveUninitialized: false
}));

app.get("/sighting", function(req, res) {
	if (!req.session.user){
		res.redirect('/login');
		return;
	}
	//TODO only send nearby locations
	res.send(JSON.stringify(sightings));
});

app.post("/sighting", function(req, res) {
	if (!req.session.user) {
		res.redirect('/login');
		return;
	}
	var newLoc = new Sighting(
		req.body.locStr,
		req.body.pokemonId,
		Date.now(),
		req.session.user);
	sightings.push(newLoc);
	res.send("success");
});

app.get("/sighting/id/:pokemonId", function(req, res) {
	if (!req.session.user) {
		res.redirect('/login');
		return;
	}
	console.log("searchId");
	res.send(JSON.stringify(sightings.filter(function(loc) { 
		return loc.pokemonId == req.params.pokemonId; 
	})));
});

app.get("/sighting/city/:cityName", function(req, res) {
	if (!req.session.user) {
		res.redirect('/login');
		return;
	}
	console.log("searchCity");
	res.send(JSON.stringify(sightings.filter(function(loc) {
		return loc.locStr == req.params.cityName;
	})));
});

app.get("/sighting/search/:cityName/:pokemonId", function(req,res){
	if (!req.session.user){
		res.redirect('/login');
		return;
	}
	console.log("searchAll");
	res.send(JSON.stringify(sightings.filter(function(loc){
		return (loc.pokemonId == req.params.pokemonId && loc.locStr == req.params.cityName);
	})));
});

app.get('/login', function(req, res){
	res.sendFile(__dirname + "/public/login.html");
});

app.post('/login', function(req, res){
	if (UserFtns.checkLogin(req.body.username, req.body.password)){
		req.session.user = req.body.username;
		res.send("success");
	} else {
		res.send("error");
	}	
});

app.get('/map(.html)?', function(req,res) {
	if (!req.session.user) {
		res.redirect("/login");
		return;
	}
	res.sendFile(__dirname + "/public/map.html");
});

app.post('/register',function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	if (UserFtns.userExists(username)){
		if(UserFtns.checkLogin(username, password)){
			req.session.user = username;
			res.send("success");
		} else {
			res.send("error");
		}
	} else {
		if (UserFtns.registerUser(username, password)){
			req.session.user = username;
			res.send("success");
		} else {
			res.send("error");
		}
	}
});


app.use(express.static("public"));

app.get('/logout', function(req, res){
	req.session.user = "";
	res.redirect('/index.html');
	return;
});

app.use(function(req, res, next) {
	res.status(404);
	res.send("It's not very effective");
});

app.listen(PORT, function() {
	console.log("Gotta catch 'em all on port " + PORT);
});
