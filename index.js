const express = require("express");
const dtEt = require("./dateTimeEt");
const fs = require("fs");
const dbInfo = require("../../../vp2024config");
const mysql = require("mysql2");
//päringu lahtiharutamiseks POST päringute puhul
const bodyparser = require("body-parser");
//parooli krüpteerimiseks
const bcrypt = require("bcrypt");
//sessioonihaldur
const session = require("express-session");
const async = require("async");
//general failis on ssselogimise kontroll
const general = require("./generalFnc");

const app = express();
app.use(session({secret: "minuAbsoluutseltSalajanaeAsi", saveUninitialized: true, resave: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
//päringu URL-i parsimine, false kui ainult tekst, true, kui muud ka
app.use(bodyparser.urlencoded({extended: true}));

//loon andmebaasiühenduse

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

app.get("/", (req, res)=>{
	//res.send("Express läks täiesti käima!");
	/*const fileList = fs.readdirSync("public/banner/");
	console.log(fileList);*/
	res.render("index",{days: dtEt.daysBetween("9-2-2024")});
});

//eesti filmi osa eraldi marsruutide failiga
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

app.get("/home", general.checkLogin, (req, res)=>{
	console.log("Sees on kasutaja: " + req.session.userId);
	res.render("home");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	console.log("Välja logitud");
	res.redirect("/");
});

app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.post("/signup", (req, res)=>{
	let notice = "Ootan andmeid!";
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("Andmeid on puudu või paroolid ei kattu!");
		notice = "Andmeid on puudu, parool liiga lühike või paroolid ei kattu!";
		res.render("signup", {notice: notice});
	}//kui andmetes viga ... lõppeb
	else {
		notice = "Andmed sisestatud!";
		//loome parooli räsi jaoks "soola"
		bcrypt.genSalt(10, (err, salt)=> {
			if(err){
				notice = "Tehniline viga, kasutajat ei loodud";
				res.render("signup", {notice: notice});
			}
			else {
				//krüpteerime
				bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
					if(err){
						notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
						res.render("signup", {notice: notice});
					}
					else {
						let sqlReq = "INSERT INTO vp1users (first_name, last_name, birth_date, gender, email, password) VALUES(?,?,?,?,?,?)";
						conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
							if(err){
								notice = "Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud.";
								res.render("signup", {notice: notice});
							}
							else {
								notice = "Kasutaja " + req.body.emailInput + " edukalt loodud!";
								res.render("signup", {notice: notice});
							}
						});//conn.execute lõpp
					}
				});//hash lõppeb
			}
		});//genSalt lõppeb
	}//kui andmed korrs, lõppeb
	//res.render("signup");
});

app.get("/timenow", (req, res)=>{
	const weekdayNow = dtEt.weekDay();
	const dateNow = dtEt.dateFormatted();
	const timeNow = dtEt.timeFormatted();
	res.render("timenow", {nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
			//throw err;
			res.render("justlist", {h2: "Vanasõnad", listData: ["Ei leidnud ühtegi vanasõna!"]});
		}
		else {
			folkWisdom = data.split(";");
			res.render("justlist", {h2: "Vanasõnad", listData: folkWisdom});
		}
	});
});

app.get("/regvisit", (req, res)=>{
	res.render("regvisit");
});

app.post("/regvisit", (req, res)=>{
	console.log(req.body);
	fs.open("public/textfiles/visitlog.txt", "a", (err, file)=>{
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/visitlog.txt", req.body.firstNameInput + " " + req.body.lastNameInput + ";", (err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati!");
					res.render("regvisit");
				}
			});
		}
	});
});

app.get("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
});

app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";

	if(!req.body.firstNameInput || !req.body.lastNameInput){
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		notice = "Osa andmeid sisestamata!";
		res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else {
		let sqlreq = "INSERT INTO vp1visitlog (first_name, last_name) VALUES(?,?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlres)=>{
			if(err){
				throw err;
			}
			else {
				notice = "Külastus registreeritud!";
				res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
			}
		});
	}
});

//eesti filmi osa eraldi marsruutide failiga
const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

//uudiste osa eraldi marsruutide failiga
const newsRouter = require("./routes/newsRoutes");
app.use("/news", newsRouter);

//fotode üleslaadimise osa eraldi marsruutide failiga
const photoupRouter = require("./routes/photouploadRoutes");
app.use("/photoupload", photoupRouter);

//galerii osa eraldi marsruutide failiga
const galleryRouter = require("./routes/galleryRoutes");
app.use("/gallery", galleryRouter);


app.listen(5100);