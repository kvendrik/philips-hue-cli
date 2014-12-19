var hue = require('node-hue-api'),

ConfigCmd = require('./cmds/Config'),
UsersCmd = require('./cmds/Users'),
pkg = require('../package.json'),
config = require('../config.json');

/**
 * Philips Hue CLI Class. Handles CLI commands.
 * @param {Array}  args      Arguments array
 * @param {String} hostname  IP address of the Philips Hue bridge
 * @param {Array}  hash      Hash or id for the bridge
 */
HueCli = function(args){

  //check if there is user data in the config file
  if(!config.auth || !config.auth.hostname || !config.auth.hash){
    args[1] = 'add';
    new UsersCmd(args);
    return;
  }

  var hostname = config.auth.hostname,
  hash = config.auth.hash;

  this.lightState = hue.lightState;
  this.api = new hue.HueApi(hostname, hash);

  this.processArgv(args);

};

/**
 * Decomposes arguments array and processes it
 * @param  {Array} args Arguments array
 */
HueCli.prototype.processArgv = function(args){

  //check if an alias is used
  var aliases = config.aliases || {};
  for(var alias in aliases){
    if(args.indexOf(alias) !== -1){
      //replace alias with value
      args = args.join(' ').replace(alias, aliases[alias]).split(' ');
    }
  }

  //if no lamp idx is given
  var lampIdx = args[0];
  if( args.length < 2 || (isNaN(lampIdx) && lampIdx !== 'all') ){

    switch(lampIdx){
      case 'init':
        console.log(
          'Welcome to the Philips Hue CLI\n'+
          'Before we start please note that this piece of\n'+
          'open-source software is in no way associated with Philips.\n'
        );
        args[1] = 'add';
        new UsersCmd(args);
        break;

      case 'users':
        new UsersCmd(args);
        break;

      case 'config':
        new ConfigCmd(args);
        break;

      case '-v':
      case '--version':
        console.log(pkg.name+' v'+pkg.version);
        break;

      default:
        console.log(
          'Philips Hue CLI.\n'+
          'Usage: hue [lampIdx|all] [options...]\n'+
          'Check http://github.com/peter-murray/node-hue-api#lightstate-options for all options\n'+
          'Please note that this piece of open-source software is in no way associated with Philips.'
        );
    }

    return;

  } else {

    //specific idx given
    //check for flags
    var flags = this.getFlags(args),
    state = this.createState(flags);

    //set light state
    this.changeLightToState(lampIdx, state);

  }

};

/**
 * Changes a lamp to the specified state
 * @param  {Number|String} lampIdx  Index of the lamp you would like to change or 'all'
 * @param  {Object}        state    Hue API state object
 */
HueCli.prototype.changeLightToState = function(lampIdx, state){

  var self = this,
  setLightState = function(lampIdx, state){
    self.api.setLightState(lampIdx, state, function(err, success){
      if(err) throw err;
      if(success){
        console.log('✔ Changed lamp '+lampIdx+'.');
      } else {
        console.error('✘ An error occured');
      }
    });
  };

  //set new state
  //to specified lamp or all
  if(lampIdx === 'all'){

    this.api.lights(function(err, lights) {
      if (err) throw err;
      lights = lights.lights;

      for(var i = 0; i < lights.length; i++){
        setLightState(lights[i].id, state);
      }
    });

  } else {

    setLightState(lampIdx, state);

  }

};

/**
 * Gets flags from arguments array
 * @param  {Array} args The constructor's arguments array
 * @return {Array}      Object array with flags key value pairs
 */
HueCli.prototype.getFlags = function(args){
  var flags = [];

  for(var i = 1; i < args.length; i++){
    var curr = args[i];
    if(curr.substr(0,2) === '--'){

      var matches = curr.replace('--','').split('=');
      flags.push({ key: matches[0], val: matches[1]  });

    }
  }

  return flags;
};

/**
 * Decomposes flags array and uses the flags to construct a new state
 * @param  {Array} flags Object array with flags key value pairs
 * @return {State}       A new Hue API State object
 */
HueCli.prototype.createState = function(flags){

  //create new state
  var state = this.lightState.create(),
      val;

  //loop flags
  for(var i = 0; i < flags.length; i++){
    var curr = flags[i];

    if(typeof state[curr.key] === 'function'){

      //check value for numbers and arrays
      val = this.checkFlagVal(curr.val);

      console.log('Adding '+curr.key+(val[0] ? ' with '+val : ''));
      state = state[curr.key](val[0], val[1], val[2]);
    } else {
      console.log(curr.key+' is not a valid flag');
    }
  }

  return state;

};

/**
 * Check a flag value for numbers and arrays
 * @param  {String} val Value to check
 * @return {Array}      Array of converted values
 */
HueCli.prototype.checkFlagVal = function(val){

  var strToNumb = function(str){
    //check if number
    if(!isNaN(str)){
      return Number(str);
    }
    return str;
  };

  if(val === undefined) return [val];

  //check for array
  if(val.indexOf(',') !== -1){
    vals = val.split(',');

    for(var i = 0; i < vals.length; i++){
      vals[i] = strToNumb(vals[i]);
    }

    return vals;

  } else {

    return [strToNumb(val)];

  }

};

module.exports = HueCli;
