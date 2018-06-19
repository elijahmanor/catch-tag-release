const tagRelease = require( "tag-release" );

tagRelease.run({release:'patch'}).then(result=>{
	console.log( "We did it:", result);
}).catch(error=>{
	console.log("BOOM:", error );
});
