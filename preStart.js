const script = async () => {
	await new Promise(r => setTimeout(r, 3000));
	console.log( "Hello from pre script" );
}

console.log( "post script before" );
script();
console.log( "pre script done" );
