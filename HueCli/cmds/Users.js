var hue = require('node-hue-api'),
readline = require('readline'),
fs = require('fs'),

config = require('../../config.json'),

Users = function(args){

  var bridgeCount,
  self = this,
  subCmd = args[1];

  switch(subCmd){
    case 'add':
      this.createNewUserInteractively();
      break;

    case 'list':
      this.listUsers();
      return;

    case 'remove':
      this.rmUser(args[2]);
      return;

    default:
      this.listUsers();
      return;
  }

};

Users.prototype.rmUser = function(userHash){

  if(!userHash){
    throw new Error('✘ Please specify a user hash/username.');
  }

  if(!config.auth.hostname){
    throw new Error('✘ No hostname found in config. Run the init command first.');
  }

  if(!config.auth.hash){
    throw new Error('✘ No hash found in config. Run the init command first.');
  }

  var api = new hue.HueApi(config.auth.hostname, config.auth.hash);
  api.unregisterUser(userHash, function(err, success) {
    if (err) throw err;
    if(success){
      console.log('✔ User removed.');
    } else {
      console.error('✘ Something went wrong.');
    }
  });

};

Users.prototype.listUsers = function(){

  if(!config.auth.hostname){
    throw new Error('✘ No hostname found in config. Run the init command first.');
  }

  if(!config.auth.hash){
    throw new Error('✘ No hash found in config. Run the init command first.');
  }

  var api = new hue.HueApi(config.auth.hostname, config.auth.hash);
  api.registeredUsers(function(err, users) {
    if(err) throw err;
    console.log(users);
  });

};

Users.prototype.createNewUserInteractively = function(){

  var self = this;

  console.log('Searching for bridges...');

  hue.locateBridges(function(err, bridges) {
    if (err) throw err;

    bridgeCount = bridges.length;
    console.log(bridgeCount+' bridge'+(bridgeCount > 1 ? 's were' : ' was')+' found.\n');

    for(var i = 0; i < bridges.length; i++){
      console.log(
        '#1: '+JSON.stringify(bridges[i])
      );
    }

    self.askWithCondition('Which one would you like to use? ',
    function(answer){
      try {
        var id = Number(answer);
        if(id > 0 && id <= bridgeCount) return true;
      } catch(err){
        return false;
      }
    },
    function(answer){
      self.createUserForBridge.call(self, bridges[answer-1]);
    });
  });

};

Users.prototype.createUserForBridge = function(bridge){

  config.auth.hostname = bridge.ipaddress;

  this.askWithCondition(
  'Press the link button on the bridge. Then press ENTER to continue: ',
  function(answer){
    return !isNaN(answer);
  },
  function(){

    hue = new hue.HueApi();
    hue.createUser(bridge.ipaddress, null, null, function(err, user) {
      if(err) throw err;
      console.log('\nUser created: '+JSON.stringify(user));

      config.auth.hash = user;
      console.log('Writing to config...');

      fs.writeFile('./config.json', JSON.stringify(config, null, 2), function(err) {
        if(err) throw err;
        console.log('✔ User saved to config. You can now start using the CLI.');
      });
    });

  });

};

Users.prototype.askWithCondition = function(question, conditional, callback){

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  var askQuestion = function(question, conditional, callback){
    rl.question(question, function(answer) {
      if(!conditional(answer)){
        askQuestion(question, conditional, callback);
      } else {
        rl.close();
        callback(answer);
      }
    });
  };

  askQuestion(question, conditional, callback);

};

module.exports = Users;
