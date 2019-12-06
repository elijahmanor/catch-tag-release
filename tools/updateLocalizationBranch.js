/* eslint no-console: off */

const { WebClient } = require( "@slack/web-api" );
const { exec } = require( "shelljs" );
const DEVELOP_BRANCH = "aaa-develop";
const L10N_BRANCH = "aaa-localization-lightning";
const QE_BRANCH_PREFIX = "aaa-localization-";

require( "dotenv" ).config();

const notifySlack = blocks => {
	const web = new WebClient( process.env.SLACK_TOKEN );
	web.chat.postMessage( {
		channel: process.env.SLACK_CHANNEL,
		blocks,
		username: "LeanKit Localization Notifier",
		icon_emoji: ":gear:" // eslint-disable-line camelcase
	} ).then( () => {} ).catch( console.error );
};
const getBlocks = ( { branch } ) => {
	const blocks = [];

	blocks.push( {
		type: "section",
		text: {
			type: "mrkdwn",
			text: `🚨 Localization changes were detected in the \`${ L10N_BRANCH }\` branch of \`web-lightning-ui\`!`
		}
	} );
	blocks.push( { type: "divider" } );
	blocks.push( {
		type: "section",
		text: {
			type: "mrkdwn",
			text: `✅ As a result a new \`${ branch }\` branch has been pushed to \`BanditSoftware\` that needs to be deployed to one of the QE dev environments for verification https://github.com/BanditSoftware/web-lightning-ui/tree/${ branch }`
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
	exec( "git fetch upstream", { silent: true } );
	const latestCommit = exec(
		`git log upstream/${ L10N_BRANCH } --no-merges --format='%H' -n 1`,
		{ silent: true }
	).stdout.trim();
	const developHasCommit = !!exec(
		`git branch --contains ${ latestCommit } | grep ${ DEVELOP_BRANCH }`,
		{ silent: true }
	).stdout;
	if ( !developHasCommit ) {
		const dateStamp = new Date().toLocaleDateString( "en-US-u-hc-h24", {
			month: "2-digit",
			year: "numeric",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		} ).replace( /[^\d]+/g, "-" ).slice( 0, -1 );
		const branch = `${ QE_BRANCH_PREFIX }${ dateStamp }`;
		exec( `git push upstream ${ L10N_BRANCH }:${ branch }`, { silent: true } );
		console.log( `Localization changes found in ${ L10N_BRANCH }. Pushed to QE branch to ${ branch }` );
		const blocks = getBlocks( { branch } );
		notifySlack( blocks );
	} else {
		console.log( `No localization changes found in ${ L10N_BRANCH }` );
	}
}() );


