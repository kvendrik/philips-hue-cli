var hue = require('node-hue-api'),

ConfigCmd = require('./cmds/Config'),
UsersCmd = require('./cmds/Users'),
pkg = require('../package.json'),
config = require('../config.json');

/**
 * Philips Hue CLI Class. Handles CLI commands.
 * @param {Array}  args      Arguments array
 * @param {Object} process   Process object for when executed through the command line
 */
HueCli = function(args, process){

  //check if there is user data in the config file
  if(!config.auth || !config.auth.hostname || !config.auth.hash){
    args[1] = 'add';
    new UsersCmd(args, process);
    process.exit(0);
  }

  var hostname = config.auth.hostname,
  hash = config.auth.hash;

  this.lightState = hue.lightState;
  this.api = new hue.HueApi(hostname, hash);
  this.process = process;

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
        new UsersCmd(args, this.process);
        break;

      case 'users':
        new UsersCmd(args, this.process);
        break;

      case 'config':
        new ConfigCmd(args, this.process);
        break;

      case '-v':
      case '--version':
        console.log(pkg.name+' v'+pkg.version);
        break;

      case '--manual':
        this.displayHelp(true);
        break;

      case '-h':
      case '--help':
      default:
        this.displayHelp();
    }

  } else {

    //specific idx given
    //check for flags
    var flags = this.getFlags(args);

    //for specified or all lamps
    //create new state and apply it to the lamp
    var lampsToChange = lampIdx === 'all' ? 3 : 1,
    errorOccured = false,
    self = this,
    state;
    
    //callback that invokes when a lamp changes
    var onLampChange = function(success, lampIdx){
      if(success){
        console.log('✔ Changed lamp '+lampIdx+'.');
      } else {
        console.error('✘ An error occured');
        errorOccured = true;
      }

      //check if the current lamp is the last one
      //if so exit when the appropriate exit code
      if(lampIdx === lampsToChange || lampsToChange === 1){
        self.process.exit(errorOccured ? 1 : 0);
      }
    };

    if(lampIdx === 'all'){

      //if the lampIdx is all
      //create new state and change lamp state
      //for each lamp seperately

      //this because if you use one state for
      //multiple lamps you get unexpected behaviour
      for(var i = 1; i <= lampsToChange; i++){
        state = this.createState(flags);
        this.changeLightToState(i, state, onLampChange);
      }

    } else {
      state = this.createState(flags);
      this.changeLightToState(lampIdx, state, onLampChange);
    }

  }

};

HueCli.prototype.throwError = function(err){
  console.error('Error: '+err);
  this.process.exit(1);
};

/**
 * Changes a lamp to the specified state
 * @param  {Number|String} lampIdx     Index of the lamp you would like to change or 'all'
 * @param  {Object}        state       Hue API state object
 * @param  {Function}      callback    Callback function that invokes when the lamp has been changed
 */
HueCli.prototype.changeLightToState = function(lampIdx, state, callback){

  //set new state
  //to specified lamp
  var self = this;
  this.api.setLightState(lampIdx, state, function(err, success){
    if(err) self.throwError(err);

    callback(success, lampIdx);
  });

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

/**
 * Displays the CLI's help message
  * @param  {Boolean} manual If true print the long manual version
 */
HueCli.prototype.displayHelp = function(manual){
  console.log(
    'Philips Hue CLI.\n'+
    'Usage: hue <lampIdx>|<all>|<users>|<init>|<config> [options...]'
  );

  if(manual){
    console.log('\n\nOPTIONS (from: https://github.com/peter-murray/node-hue-api#lightstate-options)\n'+
      '    Options for when specifing a lampIdx or "all". These will be converted\n    into a new lamp state.\n\n'+
      '    --on\n'+
      '        Turns on the specified light(s)\n\n'+
      '    --off\n'+
      '        Turns on the specified light(s)\n\n'+
      '    --alert[=<isLong>]\n'+
      '        Flashes the specified light(s) once. If <isLong> is true then\n        the alert will flash 10 times\n\n'+
      '    --white=<colorTemp>,<brightPercent>\n'+
      '        Where <colorTemp> is a value between 154 (cool) and 500 (warm)\n        and <brightPercent> is 0 to 100\n\n'+
      '    --brightness=<percent>\n'+
      '        Where <percent> is the brightness from 0 to 100\n\n'+
      '    --hsl=<hue>, <saturation>, <brightPercent>\n'+
      '        Where <hue> is a value from 0 to 359, <saturation> is a percent\n        value from 0 to 100, and <brightPercent> is from 0 to 100\n\n'+
      '    --xy=<x>, <y>\n'+
      '        Where <x> and <y> is from 0 to 1 in the Philips Color co-ordinate system\n\n'+
      '    --rgb=<red>, <green>, <blue>\n'+
      '        Where <red>, <green> and <blue> are values from 0 to 255 - Not all\n        colors can be created by the lights\n\n'+
      '    --transition=<seconds>\n'+
      '        This can be used with another setting to create a transition effect\n        (like change brightness over 10 seconds)\n\n'+
      '    --effect=<value>\n'+
      '        This can be set to "colorloop" or "none". The "colorloop" rotates\n        through all available hues at the current saturation level\n\n'+
      'HUE COMMANDS\n'+
      '    init\n'+
      '        Basically a shorthand for "users add"\n\n'+
      '    users <add>|<remove>|<list> [<user hash/username>]\n'+
      '        Add, remove or list users\n\n'+
      '    config <path> [<value>] [--unset]\n'+
      '        Get or set config values. Sets the value of the <path> to <value>.\n        If there is no value specified it prints the current value of <path>.\n        The unset flag unsets the key specified in <path>.\n\n'+
      'ALIASES\n'+
      '    You can use aliases to shorthand commands. Aliases are saved in the config file\n'+
      '    under "aliases" and can be set or viewed using the config command.\n\n'+
      '    Set alias example:\n'+
      '        hue config aliases.redalert "all --on --rgb=255,0,0 --alert=true"\n\n'+
      '    View alias example:\n'+
      '        hue config aliases.redalert\n\n'+
      'Please note that this piece of open-source software is in no way associated with Philips.'
    );
  }

  this.process.exit(0);
};

module.exports = HueCli;
