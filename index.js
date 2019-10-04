var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-lock-test", "SomeLockBridge", SomeLockBridgePlatform);
  homebridge.registerAccessory("homebridge-lock-test", "SomeLock", SomeLockAccessory);
  homebridge.registerAccessory("homebridge-lock-test", "SomeSwitch", SomeSwitchAccessory);
};

function SomeLockBridgePlatform(log, config) {
  this.log = log;
}

SomeLockBridgePlatform.prototype = {

  accessories : function(callback) {
    var accessories = [];
    accessories.push(new SomeLockAccessory(this.log));
    accessories.push(new SomeSwitchAccessory(this.log));
    callback(accessories);
  }
}

function SomeLockAccessory(log) {
  this.log = log;
  this.id = "someId";
  this.name = "someLockName";

  this.lockServiceALocked = true;
  this.lockServiceBLocked = true;
  this.lockServiceCLocked = true;

  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(Characteristic.Manufacturer, "SomeLock.io").setCharacteristic(Characteristic.Model, "Some Lock").setCharacteristic(Characteristic.SerialNumber, "SomeLock.io-Id " + this.id);

  this.lockServiceA = new Service.LockMechanism(this.name + " A", this.name + " A");
  this.lockServiceA.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateA.bind(this));
  this.lockServiceA.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateA.bind(this)).on('set', this.setState.bind(this, "A"));

  this.lockServiceB = new Service.LockMechanism(this.name + " B", this.name + " B");
  this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateB.bind(this));
  this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateB.bind(this)).on('set', this.setState.bind(this, "B"));

  this.lockServiceC = new Service.LockMechanism(this.name + " C", this.name + " C");
  this.lockServiceC.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateC.bind(this));
  this.lockServiceC.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateC.bind(this)).on('set', this.setState.bind(this, "C"));
};

SomeLockAccessory.prototype.getStateA = function(callback) {
  callback(null, this.lockServiceALocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory.prototype.getStateB = function(callback) {
  callback(null, this.lockServiceBLocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory.prototype.getStateC = function(callback) {
  callback(null, this.lockServiceCLocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory.prototype.execLockAction = function(unlockType, doLock, callback) {
  if (unlockType === "A") {
    this.lockServiceALocked = doLock;
  }
  else if (unlockType === "B") {
    this.lockServiceBLocked = doLock;
  }
  else {
    this.lockServiceCLocked = doLock;
  }
  callback();
  this.log("execLockAction is execute for unlockType '%s' and doLock '%s'", unlockType, doLock);
}

SomeLockAccessory.prototype.setState = function(unlockType, homeKitState, callback, context) {
  var doLock = homeKitState == Characteristic.LockTargetState.SECURED;
  var newHomeKitState = doLock ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
  var newHomeKitStateTarget = doLock ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED;
  this.log("S E T S T A T E: unlockType = %s, doLock = %s,homeKitState = %s", unlockType, doLock, homeKitState);

  if (unlockType === "C") {
    this.lockServiceC.getCharacteristic(Characteristic.LockTargetState).updateValue(newHomeKitStateTarget, undefined, null);
    this.lockServiceC.getCharacteristic(Characteristic.LockCurrentState).updateValue(newHomeKitState, undefined, null);
    callback(null);
    return;
  }

  var myLockActionCallback = function() {
    // update lock service A
    this.lockServiceA.getCharacteristic(Characteristic.LockTargetState).updateValue(newHomeKitStateTarget, undefined, null);
    this.lockServiceA.getCharacteristic(Characteristic.LockCurrentState).updateValue(newHomeKitState, undefined, null);

    // update lock service B
    this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).updateValue(newHomeKitStateTarget, undefined, "myContextString");
    this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).updateValue(newHomeKitState, undefined, "myContextString");

    callback(null);
  }.bind(this);

  if (context === "myContextString") {
    // only call callback as characteristic already has corret state
    callback(null);
  }
  else {
    this.execLockAction(unlockType, doLock, myLockActionCallback);
  }

};

SomeLockAccessory.prototype.getServices = function() {
  return [ this.lockServiceA, this.lockServiceB, this.lockServiceC, this.informationService ];
};

function SomeSwitchAccessory(log) {
  this.log = log;
  this.id = "someSwitchId";
  this.name = "someSwitchName";

  this.switchAOn = false;
  this.switchBOn = false;
  this.switchCOn = false;

  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(Characteristic.Manufacturer, "SomeSwitch.io").setCharacteristic(Characteristic.Model, "SomeSwitch.io Switch").setCharacteristic(Characteristic.SerialNumber, "SomeSwitch.io-Id " + this.id);

  this.switchServiceA = new Service.Switch(this.name + " A");
  this.switchServiceA.getCharacteristic(Characteristic.On).on('get', this.getStateA.bind(this)).on('set', this.setState.bind(this, "A"));

  this.switchServiceB = new Service.Switch(this.name + " B");
  this.switchServiceB.getCharacteristic(Characteristic.On).on('get', this.getStateB.bind(this)).on('set', this.setState.bind(this, "B"));

  this.switchServiceC = new Service.Switch(this.name + " C");
  this.switchServiceC.getCharacteristic(Characteristic.On).on('get', this.getStateC.bind(this)).on('set', this.setState.bind(this, "C"));
}

SomeSwitchAccessory.prototype.getStateA = function(callback) {
  this.log("Getting current state for A '%s'...", this.id);
  callback(null, switchAOn);
};

SomeSwitchAccessory.prototype.getStateB = function(callback) {
  this.log("Getting current state for B '%s'...", this.id);
  callback(null, switchBOn);
};

SomeSwitchAccessory.prototype.getStateC = function(callback) {
  this.log("Getting current state for C '%s'...", this.id);
  callback(null, switchCOn);
};

SomeSwitchAccessory.prototype.execSwitchAction = function(switchType, powerOn, callback) {
  if (switchType === "A") {
    this.switchAOn = powerOn;
  }
  else if (switchType === "B") {
    this.switchBOn = powerOn;
  }
  else {
    this.switchCOn = powerOn;
  }
  callback();
  this.log("execSwitchAction is execute for switchType '%s' and powerOn '%s'", switchType, powerOn);
}

SomeSwitchAccessory.prototype.setState = function(switchType, powerOn, callback) {
  this.log("Switch state for '%s' '%s' to '%s'...", this.id, switchType, powerOn);

  if (switchType === "C") {
    callback(null);
    return;
  }
  var mySwitchActionCallback = function() {
    // update lock service A
    this.switchServiceA.getCharacteristic(Characteristic.On).updateValue(powerOn, undefined, null);

    // update lock service B
    this.switchServiceB.getCharacteristic(Characteristic.On).updateValue(powerOn, undefined, "myContextString");

    callback(null);
  }.bind(this);

  if (context === "myContextString") {
    // only call callback as characteristic already has corret state
    callback(null);
  }
  else {
    this.execSwitchAction(switchType, powerOn, mySwitchActionCallback);
  }
};

SomeSwitchAccessory.prototype.getServices = function() {
  return [ this.switchServiceA, this.switchServiceB, this.switchServiceC, this.informationService ];
};