/* eslint no-console: off */

const fs = require( "fs" );
const path = require( "path" );
const { WebClient } = require( "@slack/web-api" );
const repos = [
	"web-home-slice",
	"web-account-slice",
	"web-analytics-slice",
	"web-card-slice",
	"web-board-slice",
	"web-search-slice",
	"web-user-slice"
];
const OUTPUT_DIRECTORY = "locale";
const yaml = require( "js-yaml" );
const { exec } = require( "shelljs" );
const DEVELOP_BRANCH = "aaa-develop";
const L10N_BRANCH = "aaa-localization-lightning";

require( "dotenv" ).config();

const notifySlack = blocks => {
	console.log( { token: process.env.SLACK_TOKEN, chanel: process.env.SLACK_CHANNEL } );
	const web = new WebClient( process.env.SLACK_TOKEN );
	web.chat.postMessage( {
		channel: process.env.SLACK_CHANNEL,
		blocks,
		username: "LeanKit Localization Notifier",
		icon_emoji: ":gear:" // eslint-disable-line camelcase
	} ).then( () => console.log( "Message sent" ) ).catch( console.error );
};
const coverage = () => {
	const files = fs.readdirSync( "locale" ).filter( f => ![ "index.js", "en-US.yaml" ].includes( f ) );
	const enUs = yaml.safeLoad( fs.readFileSync( "locale/en-US.yaml", "utf8" ) );
	return files.reduce( ( prev, file ) => {
		const otherLang = yaml.safeLoad( fs.readFileSync( `locale/${ file }`, "utf8" ) );
		const cover = Object.keys( enUs ).reduce( ( memo, key ) => {
			if ( otherLang[ key ] ) {
				memo.translated.push( key );
			} else {
				memo.untranslated.push( key );
			}
			if ( enUs[ key ] === otherLang[ key ] ) {
				memo.sameAsEnglish.push( key );
			}
			return memo;
		}, { count: Object.keys( enUs ).length, translated: [], untranslated: [], sameAsEnglish: [] } );
		prev[ file ] = cover;
		return prev;
	}, {} );
};
const getChangedKeys = ( { before, after } ) => {
	const changes = { added: [], removed: [], updated: [] };
	before = yaml.safeLoad( before );
	after = yaml.safeLoad( after );
	Object.keys( before ).forEach( beforeKey => {
		if ( after[ beforeKey ] === undefined ) {
			changes.removed.push( beforeKey );
		}
		if ( after[ beforeKey ] !== undefined && before[ beforeKey ] !== after[ beforeKey ] ) {
			changes.updated.push( beforeKey );
		}
	} );
	Object.keys( after ).forEach( afterKey => {
		if ( before[ afterKey ] === undefined ) {
			changes.added.push( afterKey );
		}
	} );
	return changes;
};
const getBlocks = ( { changed } ) => {
	const blocks = [];

	blocks.push( {
		type: "section",
		text: {
			type: "mrkdwn",
			text: `🚨 *${ changed }* localization keys changed in \`web-lightning-ui\`: \`locale/en-US.yaml\``
		}
	} );
	blocks.push( { type: "divider" } );
	blocks.push( {
		type: "section",
		text: {
			type: "mrkdwn",
			text: "📈 Summary of localization coverage:"
		}
	} );

	let stats = coverage();
	stats = Object.keys( stats ).reduce( ( memo, key ) => {
		const { translated, count, sameAsEnglish } = stats[ key ];
		memo += `• \`${ key }\`: *${ ( translated.length / count * 100 ).toFixed( 1 ) }%* translated _(${ translated.length } of ${ count } keys)_`;
		memo += `${ sameAsEnglish.length ? ` \n\t *${ sameAsEnglish.length }* translations are equal to \`en-US\`` : "" }\n\n`;
		return memo;
	}, "" );

	blocks.push( {
		type: "section",
		text: {
			type: "mrkdwn",
			text: stats
		}
	} );
	blocks.push( { type: "divider" } );
	blocks.push( {
		type: "context",
		elements: [
			{
				type: "mrkdwn",
				text: "Contact *@emanor*, *@dneiner*, or *@rreaves* for more info"
			}
		]
	} );

	return blocks;
};

( async function() {
	let enUs = `${ fs.readFileSync( "client/js/locale/en-US.yaml" ) }\n`;

	repos.forEach( repo => {
		enUs += `${ fs.readFileSync( `node_modules/@lk/${ repo }/client/js/locale/en-US.yaml` ) }\n`;
	} );

	enUs += fs.readFileSync( "node_modules/@lk/web-common-ui/locale/en-US.yaml" );

	if ( !fs.existsSync( OUTPUT_DIRECTORY ) ) {
		fs.mkdirSync( OUTPUT_DIRECTORY );
	}
	const outputPath = path.resolve( __dirname, path.join( "../", OUTPUT_DIRECTORY, "en-US.yaml" ) );

	const previousEnUs = fs.readFileSync( outputPath, "utf8" );
	if ( previousEnUs !== enUs ) {
		fs.writeFileSync( outputPath, enUs, "utf8" );
		exec( "git commit -am \"Updated en-US.yaml translation file\"", { silent: true } );
		exec( `git push upstream ${ DEVELOP_BRANCH }:${ L10N_BRANCH }`, { silent: true } );
		console.log( `en-US.yaml localization changes found. Generated new file and pushed to ${ L10N_BRANCH }` );
		const { added, removed, updated } = getChangedKeys( { before: previousEnUs, after: enUs } );
		const blocks = getBlocks( { changed: added.length + removed.length + updated.length } );
		notifySlack( blocks );
	} else {
		console.log( "No en-US.yaml localization changes found" );
	}
}() );

