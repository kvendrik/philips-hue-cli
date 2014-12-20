var config = require('../../config.json'),
fs = require('fs');

Config = function(args, process){

  var configPath = args[1],
  toValue = args[2];

  this.process = process;

  if(configPath){

    if(args.indexOf('--unset') !== -1){
      //unset value
      this.unsetKey(configPath);
    } else if(toValue){
      //if there is a value
      //set value
      this.setValue(configPath, toValue);
    } else {
      //if not echo the current value
      console.log(this.getValue(configPath));
      process.exit(0);
    }

  } else {
    console.log(config);
    process.exit(0);
  }

};

Config.prototype.getLastKey = function(jsonPath){

  var keys = jsonPath.split('.'),
  currPos = config;

  for(var i = 0; i < keys.length; i++){
    var curr = currPos[keys[i]];

    if(curr === undefined){
      currPos[keys[i]] = {};
    }

    if(i !== keys.length-1){
      currPos = currPos[keys[i]];
    }
  }

  return { parent: currPos, key: keys[keys.length-1] };

};

Config.prototype.getValue = function(jsonPath){

  var details = this.getLastKey(jsonPath);
  return details.parent[details.key];

};

Config.prototype.writeConfigJson = function(json, callback){

  var self = this;
  fs.writeFile('./config.json', JSON.stringify(json, null, 2), function(err) {
    if(err){
      console.error('Error: '+err);
      self.process.exit(1);
    }
    callback();
  });

};

Config.prototype.setValue = function(jsonPath, value){

  var details = this.getLastKey(jsonPath);
  details.parent[details.key] = value;

  var self = this;
  this.writeConfigJson(config, function(){
    console.log('✔ Saved to config.');
    self.process.exit(0);
  });

};

Config.prototype.unsetKey = function(jsonPath){

  var details = this.getLastKey(jsonPath);
  delete details.parent[details.key];

  var self = this;
  this.writeConfigJson(config, function(){
    console.log('✔ Removed from config.');
    self.process.exit(0);
  });

};

module.exports = Config;