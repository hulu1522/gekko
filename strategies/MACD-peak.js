/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false,
    lastdiff: 0.0
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings);
};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
};

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var digits = 8;
  var macd = this.indicators.macd;

  var diff = macd.diff;
  var signal = macd.signal.result;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'short:', macd.short.result.toFixed(digits));
  log.debug('\t', 'long:', macd.long.result.toFixed(digits));
  log.debug('\t', 'macd:', diff.toFixed(digits));
  log.debug('\t', 'signal:', signal.toFixed(digits));
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
  log.debug('\t', 'lastdiff:', this.trend.lastdiff.toFixed(digits));
};

method.check = function() {
  var macddiff = this.indicators.macd.result;
  var posdiff = macddiff > 0 ? true : false;
  var trendup = (macddiff > this.trend.lastdiff) && (posdiff === false) || (macddiff > this.trend.lastdiff) && (posdiff === true);

  if(Math.abs(macddiff - this.trend.lastdiff) >= this.settings.threshold.min) {
    var advise = trendup ? 'short' : 'long';

    // No trend detected
    if(this.trend.direction !== 'none')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'none',
        adviced: false
      };

    this.trend.duration++;
    this.trend.lastdiff = macddiff;

    log.debug('No trend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.threshold.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice(advise);
    } else
      this.advice();

  } else if( trendup ) {

    // new trend detected
    if(this.trend.direction !== 'up')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      };

    this.trend.duration++;
    this.trend.lastdiff = macddiff;

    log.debug('In uptrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.threshold.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else if( !trendup ) {

    // new trend detected
    if(this.trend.direction !== 'down')
      // reset the state for the new trend
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      };

    this.trend.duration++;
    this.trend.lastdiff = macddiff;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.threshold.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();
  }
};

module.exports = method;
