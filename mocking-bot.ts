import {WebClient} from '@slack/web-api'
import {RTMClient} from '@slack/'
import {createServer} from 'http';
import {BOT_TOKEN, CLIENT_SECRET, SIGNING_SECRET, USER_TOKEN} from "./constants";

// const {createEventAdapter} = require('@slack/events-api');
const {createMessageAdapter} = require('@slack/interactive-messages');
const {users} = require('./models');
const app = require('express')();
const http = require('http');
const bodyParser = require('body-parser');

// const slackEvents = createEventAdapter(SIGNING_SECRET);
const web = new WebClient(BOT_TOKEN);
const slackInteractions = createMessageAdapter(SIGNING_SECRET);

const port = process.env.PORT || 3000;

let result = '';
let response = {};

app.use('/slack/actions', slackInteractions.expressMiddleware());
app.post('/slack/commands', bodyParser.urlencoded({extended: false}), slackSlashCommand);

// Start a basic HTTP server
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});

// Slack interactive message handlers
slackInteractions.action({callbackId: 'send_message'}, (payload, respond) => {
    console.log(`The user ${payload.user.name} with user_id ${payload.user.id} in team ${payload.team.domain} pressed a button`);

    web.users.info({user: payload.user.id}).then((results) => {
        // @ts-ignore
        const icon_url = results.user.profile.image_48;
        // @ts-ignore
        const username = results.user.profile.display_name_normalized;
        // respond({
        //     delete_original: true
        // });
        response = buildResponse(icon_url, username);
    });
    return response;

    // users.findBySlackId(payload.user.id)
    //     .then(users => users.sendAlteredMessage(payload.actions[0].value === 'accept')
    //         .then(() => {
    //             if (users.accepted) {
    //                 respond({
    //                     delete_original: true
    //                 });
    //                 console.log(payload.channel.id);
    //                 web.im.list({}).then((results) => { console.log(results.ims) });
    //                 web.users.info({user: payload.user.id}).then((results) => {
    //                     // @ts-ignore
    //                     const icon_url = results.user.profile.image_48;
    //                     // @ts-ignore
    //                     const username = results.user.profile.display_name_normalized;
    //                     try {
    //                         web.chat.postMessage({
    //                             channel: payload.channel.id,
    //                             text: result,
    //                             // as_user: false,
    //                             icon_url: icon_url,
    //                             username: username,
    //                             response_type: 'in_channel'
    //                         }).then(() => {
    //                         }, (error) => {
    //                             console.log(error)
    //                         });
    //                     } catch {
    //
    //                     }
    //                 }, (error) => {
    //                     console.error(error)
    //                 });
    //             } else {
    //                 respond({
    //                     delete_original: true
    //                 })
    //             }
    //         })
    //     ).catch((error) => {
    //     console.error(error);
    // });
});

class MockingBot {

    buildResponse(icon, username) {
        return {
            // channel: payload.channel.id,
            text: result,
            response_type: 'in_channel',
            icon_url: icon,
            username: username,
        }
    }

    getPayload(text) {
        return {
            text: text,
            response_type: 'ephemeral',
            attachments: [{
                text: 'Do you want to send this?',
                callback_id: 'send_message',
                actions: [
                    {
                        name: 'send_message',
                        text: 'Yes',
                        value: 'accept',
                        type: 'button',
                        style: 'primary',
                    },
                    {
                        name: 'send_message',
                        text: 'No',
                        value: 'deny',
                        type: 'button',
                        style: 'danger',
                    },
                ],
            }],
        };
    }

    function

    alterMessage(text) {
        const wordsArray = text.split('');
        for (let i = 0; i < wordsArray.length; i += 2) {
            wordsArray[i] = wordsArray[i].toUpperCase();
        }
        result = wordsArray.toString().replace(/,/g, '');
        return result;
    }

    function

    slackSlashCommand(req, res, next) {
        if (req.body.command === '/mock') {
            const text = req.body.text;
            const newText = alterMessage(text);
            const interactiveButtons = getPayload(newText);
            res.json(interactiveButtons);
        }
    }
}