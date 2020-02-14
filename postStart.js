const script = async () => {
	await new Promise(r => setTimeout(r, 3000));
	console.log( "Hello from post script" );
}

console.log( "post script before" );
script();
console.log( "post script done" );