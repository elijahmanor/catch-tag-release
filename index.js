const tagRelease = require( "tag-release" );
console.log( "Hello World!!" );
console.log( "wuz up?" );
console.log( 'howdy' );
console.log( 'howdy' );
console.log( 'howdy' );
console.log( 'howdy' );
console.log( 'howdy' );

tagRelease.run({release:'minor'}).then(result=>{
	console.log( "We did it:", result);
}).catch(error=>{
	console.log("BOOM:", error );
});
