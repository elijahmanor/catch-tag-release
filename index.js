const tagRelease = require(    "tag-release");

tagRelease.run({release:"major", cwd: "./" }).then(result=>{
	console.log( "You did it:", result, "Yay2" );
}).catch(error=>{
	console.log("BOOM:", error );
	console.log("wat");
});
