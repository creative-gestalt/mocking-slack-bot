import {WebClient} from '@slack/web-api'
import {BOT_TOKEN, CLIENT_SECRET, SIGNING_SECRET, USER_TOKEN} from "./constants";

const {createMessageAdapter} = require('@slack/interactive-messages');
const slackInteractions = createMessageAdapter(SIGNING_SECRET);
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const web = new WebClient(BOT_TOKEN);
const {users} = require('./models');
const app = require('express')();
const http = require('http');
let result = '';

app.use('/slack/actions', slackInteractions.expressMiddleware());
app.post('/slack/commands', bodyParser.urlencoded({extended: false}), slackSlashCommand);
http.createServer(app).listen(port, () => {
    console.log(`server listening on port ${port}`);
});

slackInteractions.action({callbackId: 'send_message'}, (payload, respond) => {
    console.log(`${payload.user.name} pressed a button`);

    users.findBySlackId(payload.user.id)
        .then(users => users.sendAlteredMessage(payload.actions[0].value === 'accept')
            .then(() => {
                if (users.accepted) {

                    // send as user in a channel
                    web.users.info({user: payload.user.id}).then((results) => {
                        // @ts-ignore
                        const icon_url = results.user.profile.image_48;
                        // @ts-ignore
                        const username = results.user.profile.display_name_normalized;
                        web.chat.postMessage({
                            channel: payload.channel.id,
                            text: result,
                            icon_url: icon_url,
                            username: username,
                            response_type: 'in_channel'
                        }).then(() => {
                            respond({
                                delete_original: true
                            });
                        }, () => {

                            // if a user posts in a DM, send as bot user.
                            console.log(payload.user.name + ' posted in a DM');
                            respond({
                                // channel: payload.channel.id,
                                text: 'Unfortunately, slack doesn\'t allow bot interactions without the bot present. Please invite the bot.',
                                response_type: 'ephemeral',
                            })
                        });
                    }, (error) => {
                        console.error(error)
                    });
                } else {
                    respond({
                        delete_original: true
                    })
                }
            })
        ).catch((error) => {
        console.error(error);
    });
});

function getPayload(text) {
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

function alterMessage(text) {
    const wordsArray = text.split('');
    for (let i = 0; i < wordsArray.length; i += 2) {
        wordsArray[i] = wordsArray[i].toUpperCase();
    }
    result = wordsArray.toString().replace(/,/g, '');
    return result;
}

function slackSlashCommand(req, res, next) {
    if (req.body.command === '/mock') {
        const text = req.body.text;
        const newText = alterMessage(text);
        const interactiveButtons = getPayload(newText);
        res.json(interactiveButtons);
    }
}