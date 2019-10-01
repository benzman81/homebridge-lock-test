var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-lock-test", "SomeLockBridge", SomeLockBridgePlatform);
  homebridge.registerAccessory("homebridge-lock-test", "SomeLock", SomeLockAccessory);
};

function SomeLockBridgePlatform(log, config) {
  this.log = log;
}

SomeLockBridgePlatform.prototype = {

  accessories : function(callback) {
    var accessories = [];
    accessories.push(new SomeLockAccessory(this.log));
    callback(accessories);
  }
}

function SomeLockAccessory(log) {
  this.log = log;
  this.id = "someId";
  this.name = "someLockName";

  this.lockServiceALocked = true;
  this.lockServiceBLocked = true;

  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(Characteristic.Manufacturer, "SomeLock.io").setCharacteristic(Characteristic.Model, "Some Lock").setCharacteristic(Characteristic.SerialNumber, "SomeLock.io-Id " + this.id);

  this.lockServiceA = new Service.LockMechanism(this.name + " A", this.name + " A");
  this.lockServiceA.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateA.bind(this));
  this.lockServiceA.getCharacteristic(Characteristic.LockTargetState).on('get', this.getState.bind(this)).on('set', this.setState.bind(this, "A"));

  this.lockServiceB = new Service.LockMechanism(this.name + " B", this.name + " B");
  this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateB.bind(this));
  this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).on('get', this.getState.bind(this)).on('set', this.setState.bind(this, "B"));
};

SomeLockAccessory.prototype.getStateA = function(callback) {
  callback(null, this.lockServiceALocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory.prototype.getStateB = function(callback) {
  callback(null, this.lockServiceBLocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory.prototype.execLockAction = function(unlockType, doLock, callback) {
  if (unlockType === "A") {
    this.lockServiceALocked = doLock;
  }
  else {
    this.lockServiceBLocked = doLock;
  }
  callback();
  this.log("execLockAction is execute for unlockType '%s' and doLock '%s'", unlockType, doLock);
}

SomeLockAccessory.prototype.setState = function(unlockType, homeKitState, callback, context) {
  var doLock = homeKitState == Characteristic.LockTargetState.SECURED;
  var newHomeKitState = doLock ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
  var newHomeKitStateTarget = doLock ? Characteristic.LockTargetState.SECURED : Characteristic.LockTargetState.UNSECURED;
  this.log("S E T S T A T E: unlockType = %s, doLock = %s,homeKitState = %s", unlockType, doLock, homeKitState);

  var myLockActionCallback = function() {
    // update lock service A
    this.lockServiceA.getCharacteristic(Characteristic.LockTargetState).updateValue(newHomeKitStateTarget, undefined, null);
    this.lockServiceA.getCharacteristic(Characteristic.LockCurrentState).updateValue(newHomeKitStateCurrent, undefined, null);

    // update lock service B
    this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).updateValue(newHomeKitStateTarget, undefined, "myContextString");
    this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).updateValue(newHomeKitStateCurrent, undefined, "myContextString");

    callback(null);
  }

  if (context === "myContextString") {
    // only call callback as characteristic already has corret state
    callback(null);
  }
  else {
    this.execLockAction(unlockType, doLock, myLockActionCallback);
  }

};

SomeLockAccessory.prototype.getServices = function() {
  return [ this.lockServiceA, this.lockServiceB, this.informationService ];
};