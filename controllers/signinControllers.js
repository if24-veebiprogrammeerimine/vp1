const mysql = require("mysql2");
const dbInfo = require("../../../../vp2024config");
//parooli krüpteerimiseks
const bcrypt = require("bcrypt");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

//@desc home page for signin
//@route GET /signin
//@access public

const signinPage = (req, res)=>{
	res.render("signin");
};

//@desc signingin
//@route POST /signin
//@access public

const signingin = (req, res)=>{
	let notice = "";
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Andmeid puudu");
		notice = "Sisselogimise andmeid on puudu!";
		res.render("signin",{notice: notice});
	}
	else {
		let sqlReq = "SELECT id, password FROM vp1users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				console.log("Viga andmebaasist lugemisel!" + err);
				notice = "Tehniline viga, sisselogimine ebaõnnestus!";
				res.render("signin",{notice: notice});
			}
			else {
				if(result[0] != null){
					//kasutaja on olemas, kontrollime sisestatud parooli
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice = "Tehniline viga, sisselogimine ebaõnnestus!";
							res.render("signin",{notice: notice});
						}
						else {
							//kas õige või vale parool
							if(compareresult){
								//notice = "Oled sisse loginud!";
								//res.render("signin",{notice: notice});
								req.session.userId = result[0].id;
								res.redirect("/home");
							}
							else {
								notice = "Kasutajatunnus ja/või parool on vale!";
								res.render("signin",{notice: notice});
							}
						}
					});
				}
				else {
					notice = "Kasutajatunnus ja/või parool on vale!";
					res.render("signin",{notice: notice});
				}
			}
		});//conn.execute lõppeb
	}
	//res.render("index",{days: dtEt.daysBetween("9-2-2024")});
};


module.exports = {
	signinPage,
	signingin
};