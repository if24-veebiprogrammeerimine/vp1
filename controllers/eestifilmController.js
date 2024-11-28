//andmebaasiga suhtlemine
const mysql = require("mysql2");
//andmebaasi andmed
const dbInfo = require("../../../../vp2024config");
//loon andmebaasiühenduse
const connInga = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: "if24_inga_pe_DM"
});
const asyn = require('async');

//@desc opening page
//@route GET /api/eestifilm
//@access public

const eestifilm = (req, res)=>{
	console.log("Sees on kasutaja: " + req.session.userId);
	res.render("filmindex");
};

//@desc film persons list
//@route GET /api/eestifilm
//@access public

const tegelased = (req, res)=>{
	//loon andmebaasipäringu
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	connInga.query(sqlReq, (err, sqlRes)=>{
		if(err){
			res.render("tegelased", {persons: []});
			//throw err;
		}
		else {
			//console.log(sqlRes);
			res.render("tegelased", {persons: sqlRes});
		}
	});
};

//@desc page for adding data
//@route GET /api/eestifilm
//@access public

const lisa = (req, res)=>{
	res.render("addperson");
};

//@desc page for adding relations
//@route GET /api/eestifilm
//@access public

const lisaseos = (req, res)=>{
	//kasutades async moodulit, panen mitu andmebaasipäringut paraleelselt toimima
	//loon SQL päringute (lausa tegevuste ehk funktsioonide) loendi
	const myQueries = [
		function(callback){
			connInga.execute("SELECT id, first_name, last_name, birth_date FROM person", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			connInga.execute("SELECT id, title, production_year FROM movie", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			connInga.execute("SELECT id, position_name FROM position", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		}
	];
	asyn.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			console.log(results);
			res.render("addrelations", {personList: results[0], movieList: results[1], positionList: results[2]});
		}
	});
};

module.exports = {
    eestifilm,
    tegelased,
    lisa,
    lisaseos
};