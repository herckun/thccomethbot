require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {
    Client,
    Intents,
    MessageEmbed,
    MessageActionRow, MessageButton
} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});
const token = process.env.BOT_TOKEN;
const commands = [
  new SlashCommandBuilder()
	.setName('match')
	.setDescription('Let others know you are searching for a match right now'),
  new SlashCommandBuilder()
	.setName('pmatch')
	.setDescription('Create a private game code and dm it to the other player')
  .addUserOption(option => 
    option
    .setName('player')
    .setDescription('the other player')
    .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('setrole')
    .setDescription('Set THC Cometh player role')
    .addRoleOption(option => 
      option
      .setName('role')
      .setDescription('the Cometh player role')
      .setRequired(true)
      )
  
];
let inSearching = [];
let pingRole = `everyone`;

async function updateList(i)
{
  const embed = new MessageEmbed()
  .setColor('#0099ff')
  .setTimestamp();
  const row = new MessageActionRow()
  .addComponents(
  new MessageButton()
        .setCustomId(`matchfound${i.user.id}`)
        .setLabel('I found a match')
        .setStyle('DANGER'),
  new MessageButton()
        .setCustomId(`matchlooking${i.user.id}`)
        .setLabel(`I'm searching for a match`)
        .setStyle('PRIMARY')
  );
  inSearching.map(p => {
    embed.addFields(p)
  });
  if(!inSearching.length)
  {
    embed.setDescription('No one is looking for a match')
  }
  i.message.edit({content :`${pingRole == 'everyone' ? '@everyone' : '<@&$'+pingRole+'>'} The list updated`,embeds: [embed]});
}
function genCode()
{
  let result = '';
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let clength = chars.length;
  for ( var i = 0; i < 5; i++ ) {
    result += chars.charAt(Math.floor(Math.random() * clength));
  }
  return result;  
}

//register commands
client.once('ready', () => {
  const rest = new REST({ version: '9' }).setToken(token);
  (async () => {
    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      );

    } catch (error) {
        console.log('err');
        //
    }
  })();
});

//

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  switch(interaction.commandName)
  {
  case 'match' :
    const embed = new MessageEmbed()
    	.setColor('#0099ff')
    	.setTimestamp();
      const row = new MessageActionRow()
      .addComponents(
      new MessageButton()
            .setCustomId(`matchfound${interaction.user.id}`)
            .setLabel('I found a match')
            .setStyle('DANGER'),
      new MessageButton()
            .setCustomId(`matchlooking${interaction.user.id}`)
            .setLabel(`I'm searching for a match`)
            .setStyle('PRIMARY')
      );
      inSearching.map(p => {
        embed.addFields(p)
      });
      if(!inSearching.length)
      {
        embed.setDescription('No one is looking for a match')
      }

    await interaction.reply({embeds: [embed], components: [row]});
    const filter = i => i.customId.startsWith('match');
    const collector = interaction.channel.createMessageComponentCollector({ filter});
    collector.on('collect', async i => {
      if (i.customId.startsWith('matchfound')) {
        inSearching = inSearching.filter(p => !p.name.startsWith(i.user.username));
        updateList(i);
        return i.reply({
          content: `Got it, removed you from the list`,
          ephemeral: true
        })
      }
      if (i.customId.startsWith('matchlooking')) {
        inSearching = inSearching.filter(p => !p.name.startsWith(i.user.username));
        inSearching.push({ name: i.user.username + ' is searching for a match', value: `Please try not looking for a match right now to not get matchmached with ${i.user.username }` });
        updateList(i);
        return i.reply({
          content: `Got it, added you on the list`,
          ephemeral: true
        });
      }    
    });
  break;
  case 'pmatch':
  try{
      let player = interaction.options.get('player');
      let code = genCode();
      (await player.user.send('Private game code : ' + code));
      (await interaction.user.send('Private game code : ' + code));
      interaction.reply(`Sent <@${player.user.id}> a DM with a game code`);
  }
  catch(err)
  {
      console.log(err);
  }
  break;
  case 'setrole':
    try{
      let role = interaction.options.get('role');
      pingRole = role.value;
      return interaction.reply({
        content: `Got it, ping role updated`,
        ephemeral: true
      });
  }
  catch(err)
  {
      console.log(err);
  }    
  }
});

client.login(token);