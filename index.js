const tagRelease = require("tag-release");

tagRelease.run({release:"minor", cwd: './' }).then(result=>{
	console.log( "You did it:", result, "Yay");
}).catch(error=>{
	console.log("BOOM:", error );
});
