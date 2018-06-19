const tagRelease = require( "tag-release" );

tagRelease.run({release:'minor'}).then(result=>{
	console.log( "We did it:", result);
}).catch(error=>{
	console.log("BOOM:", error );
});
