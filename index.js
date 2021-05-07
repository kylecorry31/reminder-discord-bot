const Discord = require("discord.js");
var schedule = require("node-schedule");
const { meetings } = require("./meetings.json");
const { token } = require("./token.json");

console.log(meetings);

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Synapse bot is online");
});

function sendMessage(message) {
  try {
    // TODO: Find out a better way of doing this
    const generalChannels = client.channels.cache.filter(
      (ch) => ch.name === "general"
    );
    generalChannels.forEach((it) => it.send(message));
  } catch (e) {
    console.error(e);
  }
}

client.login(token);

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }

    if (msg.content === '!events'){
      let meetingString = "";
      for (meeting of meetings){
        meetingString += `${meeting.name}\n\t\t ${meeting.repeat ? 'Every' : ''} ${meeting.days.join(',')} at ${meeting.time}\n\n`;
      }

      msg.reply(meetingString.trim());
    }
});

// TODO: Parse the date and time strings
meetings.forEach(meeting => {
  console.log(`Meeting ${meeting.name} scheduled for ${meeting.reminder.when}`);
  schedule.scheduleJob(meeting.name + " - reminder", meeting.reminder.when, () => {
    sendMessage('@everyone ' + meeting.reminder.message);
  });

  schedule.scheduleJob(meeting.name + " - upcoming reminder", meeting.upcoming_reminder.when, () => {
    sendMessage('@everyone ' + meeting.upcoming_reminder.message);
  });
});