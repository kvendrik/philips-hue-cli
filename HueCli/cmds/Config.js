var config = require('../../config.json'),
fs = require('fs');

Config = function(args, process){

  var configPath = args[1],
  toValue = args[2];

  this.process = process;

  if(configPath){
    if(toValue){

      this.setValue(configPath, toValue);

    } else {

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


Config.prototype.setValue = function(jsonPath, value){

  var details = this.getLastKey(jsonPath);
  details.parent[details.key] = value;

  var self = this;

  fs.writeFile('./config.json', JSON.stringify(config, null, 2), function(err) {
    if(err){
      console.error('Error: '+err);
      self.process.exit(1);
    }
    console.log('✔ Saved to config.');
    process.exit(0);
  });
};

module.exports = Config;