var config = require('../../config.json'),
fs = require('fs');

Config = function(args){

  var configPath = args[1],
  toValue = args[2];

  if(configPath){
    if(toValue){

      this.setValue(configPath, toValue);

    } else {

      console.log(this.getValue(configPath));

    }
  } else {
    console.log(config);
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

  fs.writeFile('./config.json', JSON.stringify(config, null, 2), function(err) {
    if(err) throw err;
    console.log('✔ Saved to config.');
  });
};

module.exports = Config;