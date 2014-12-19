var hue = require('node-hue-api');

/**
 * Philips Hue CLI Class. Handles CLI commands.
 * @param {Array}  argv      Command line arguments array
 * @param {String} hostname  IP address of the Philips Hue bridge
 * @param {Array}  hash      Hash or id for the bridge
 */
HueCli = function(argv, hostname, hash){

  //get config file
  var settings;
  try {
    settings = require('./.hue.json');

    if(!hostname){
      if(!settings.auth.hostname){
        throw new Error('✘ Specify either a hostname in the constructor or in a .hue.json file.');
      } else {
        hostname = settings.auth.hostname;
      }
    }

    if(!hash){
      if(!settings.auth.hash){
        throw new Error('✘ Specify either a hash in the constructor or in a .hue.json file.');
      } else {
        hash = settings.auth.hash;
      }
    }
  } catch(err){
    settings = undefined;

    if(!hostname || !hash){
      throw new Error('✘ Specify either a hostname and hash in the constructor or in a .hue.json file.');
    }
  }

  this.lightState = hue.lightState;
  this.api = new hue.HueApi(hostname, hash);
  this.settings = settings;

  this.processArgv(argv);

};

/**
 * Decomposes arguments array and processes it
 * @param  {Array} argv Command line arguments array
 */
HueCli.prototype.processArgv = function(argv){
  var lampIdx = argv[2];

  //no specific command
  //show help
  if( argv.length < 4 || (isNaN(lampIdx) && lampIdx !== 'all') ){

    console.log(
      'Philips Hue CLI.\n'+
      'Usage: ./hue [lampIdx|all] [options...]\n'+
      'Check http://github.com/peter-murray/node-hue-api#lightstate-options for all options'
    );
    return;

  } else {

    //check if an alias is used
    var aliases = this.settings.aliases || {};
    for(var alias in aliases){
      if(argv.indexOf(alias) !== -1){
        //replace alias with value
        argv = argv.join(' ').replace(alias, aliases[alias]).split(' ');
      }
    }

    //specific idx given
    //check for flags
    var flags = this.getFlags(argv),
    state = this.handleFlags(flags);

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
 * @param  {Array} argv Command line arguments array
 * @return {Array}      Object array with flags key value pairs
 */
HueCli.prototype.getFlags = function(argv){
  var flags = [];

  for(var i = 3; i < argv.length; i++){
    var curr = argv[i];
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
HueCli.prototype.handleFlags = function(flags){

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