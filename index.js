const Discord = require("discord.js");
var schedule = require("node-schedule");
const { token } = require("./token.json");
const redis = require("redis");
const redisClient = redis.createClient({host: 'redis'});

const createMessageRegex = /!create\s+([0-9a-zA-Z-]+)\s+\'([\d\*]+\s[\d\*]+\s[\d\*]+\s[\d\*]+\s[\d\*]+)\'\s(.*)/g;

const jobMap = {};

redisClient.on("error", function(error) {
  console.error(error);
});

redisClient.get("name", redis.print);

const client = new Discord.Client();

client.once("ready", () => {
  console.log("Reminder bot is online");
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

loadEvents();

client.on('message', msg => {
    if (msg.content === '!ping') {
        msg.reply('pong');
    }

    if (msg.content === '!events'){
      getEvents(msg);
    }

    if (msg.content.startsWith("!create")){
      const createMatches = [...msg.content.matchAll(createMessageRegex)];
      if (createMatches.length > 0){
        addEvent(createMatches[0][1], createMatches[0][2], createMatches[0][3], msg);
      }
    }

    if (msg.content.startsWith("!get")){
      const split = msg.content.split(' ');
      if (split.length > 0){
        const key = split[1];
        getEvent(key, msg);
      }
    }

    if (msg.content.startsWith("!delete")){
      const split = msg.content.split(' ');
      if (split.length > 0){
        const key = split[1];
        removeEvent(key, msg);
      }
    }
});

function loadEvents(){
  redisClient.lrange('events', 0, -1, (err, reply) => {
    reply.forEach((key) => {
      redisClient.get(key, (err, reply) => {
        if (reply){
          const json = JSON.parse(reply);
          console.log(json);
          scheduleEvent(key, json.cron, json.message);
        }
      });
    });
  });
}

function addEvent(key, cron, message, msg){
  redisClient.set(key, JSON.stringify({cron, message}), () => {
    msg.reply(`${key} was created with schedule: ${cron}`);
    scheduleEvent(key, cron, message);
  });
  redisClient.lrem('events', 0, key, () => {});
  redisClient.rpush('events', key, () => {});
}

function removeEvent(key, msg){
  redisClient.del(key, (err, ok) => {
    if (ok){
      msg.reply(`${key} was deleted`);
      redisClient.lrem('events', 0, key, () => {});
      unscheduleEvent(key);
    }
  });
}

function getEvent(key, msg){
  redisClient.get(key, (err, reply) => {
    msg.reply(`${key}: ${reply}`);
  });
}

function getEvents(msg){
  redisClient.lrange('events', 0, -1, (err, reply) => {
    if (reply.length == 0){
      msg.reply('No events');
    }
    reply.forEach((key) => {
      getEvent(key, msg);
    });
  });
}

function scheduleEvent(key, cron, message){
  unscheduleEvent(key);
  console.log(`Scheduling ${key} for ${cron}`);
  const job = schedule.scheduleJob(key, cron, () => {
    sendMessage('@everyone ' + message);
  });

  jobMap[key] = job;
}

function unscheduleEvent(key){
  const job = jobMap[key];
  job?.cancel();
}