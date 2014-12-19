var hue = require('node-hue-api'),
readline = require('readline'),
fs = require('fs'),

config = require('../../config.json'),

Users = function(args, process){

  var bridgeCount,
  self = this,
  subCmd = args[1];

  this.process = process;

  switch(subCmd){
    case 'add':
      this.createNewUserInteractively();
      break;

    case 'list':
      this.listUsers();
      break;

    case 'remove':
      this.rmUser(args[2]);
      break;

    default:
      this.listUsers();
  }

};

Users.prototype.rmUser = function(userHash){

  var self = this;

  if(!userHash){
    console.error('✘ Please specify a user hash/username.');
    this.process.exit(1);
  }

  if(!config.auth.hostname){
    console.error('✘ No hostname found in config. Run the init command first.');
    this.process.exit(1);
  }

  if(!config.auth.hash){
    console.error('✘ No hash found in config. Run the init command first.');
    this.process.exit(1);
  }

  var api = new hue.HueApi(config.auth.hostname, config.auth.hash);
  api.unregisterUser(userHash, function(err, success) {
    if(err){
      console.error(err);
      this.process.exit(1);
    }

    console.log('✔ User removed.');
    self.process.exit(0);
  });

};

Users.prototype.listUsers = function(){

  var self = this;

  if(!config.auth.hostname){
    console.error('✘ No hostname found in config. Run the init command first.');
    this.process.exit(1);
  }

  if(!config.auth.hash){
    console.error('✘ No hash found in config. Run the init command first.');
    this.process.exit(1);
  }

  var api = new hue.HueApi(config.auth.hostname, config.auth.hash);
  api.registeredUsers(function(err, users) {
    if(err){
      console.error(err);
      self.process.exit(1);
    }

    console.log(users);
    self.process.exit(0);
  });

};

Users.prototype.createNewUserInteractively = function(){

  var self = this;

  console.log('Searching for bridges...');

  hue.locateBridges(function(err, bridges) {
    if(err){
      console.error(err);
      self.process.exit(1);
    }

    var bridgeCount = bridges.length;

    if(bridgeCount > 0){

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

    } else {
      console.error('✘ No bridges found.');
      self.process.exit(1);
    }

  });

};

Users.prototype.createUserForBridge = function(bridge){

  config.auth.hostname = bridge.ipaddress;
  var self = this;

  this.askWithCondition(
  'Press the link button on the bridge. Then press ENTER to continue: ',
  function(answer){
    return !isNaN(answer);
  },
  function(){

    hue = new hue.HueApi();
    hue.createUser(bridge.ipaddress, null, null, function(err, user) {
      if(err){
        console.error(err);
        self.process.exit(1);
      }

      console.log('\nUser created: '+JSON.stringify(user));

      config.auth.hash = user;
      console.log('Writing to config...');

      fs.writeFile('./config.json', JSON.stringify(config, null, 2), function(err) {
        if(err){
          console.error(err);
          self.process.exit(1);
        }

        console.log('✔ User saved to config. You can now start using the CLI.');
        self.process.exit(0);
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
