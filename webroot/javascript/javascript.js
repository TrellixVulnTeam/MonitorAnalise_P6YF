﻿if (!String.capitalize) String.prototype.capitalize = function capitalize() {
  return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
    return p1 + p2.toUpperCase() }) };
if (!String.camelCase) String.prototype.camelCase = function camelCase() {
  return this.replace(/(\-[a-z])/g, function($1) {
    return $1.toUpperCase().replace("-", "") }) };
if (!String.printf) String.prototype.printf = function printf(obj) {
  return this.replace(/{([^{}]*)}/g, function(a, b) {
    var r = obj[b];
    return typeof r === "string" ? r : typeof r === "number" ? r : a }) };
if (!String.ellipsis) String.prototype.ellipsis = function ellipsis(length) {
  return this.length > length ? this.substr(0, length) + String.fromCharCode(8230) : this };
if (!String.centerellipsis) String.prototype.centerellipsis = function centerellipsis(length) {
  return this.length > length ? this.substr(0, Math.floor(length / 2)) + String.fromCharCode(8230) + this.substr(Math.floor(length / -2)) : this };
if (!Math.sign) Math.sign = function sign(x) {
  return typeof x == "number" ? x ? x < 0 ? -1 : 1 : isNaN(x) ? NaN : 0 : NaN };
window.typeOf = function(t) {
  if (t instanceof $) return "jQuery";
  else return String(t.constructor).split(" ")[1].split("()").join("") };
if (!Date.addDays) Date.prototype.addDays = function(days) { this.setDate(this.getDate() + days) };
if (!Date.addHours) Date.prototype.addHours = function(hours) { this.setHours(this.getHours() + hours);
  return this };
if (!Date.addMinutes) Date.prototype.addMinutes = function(minutes) { this.setMinutes(this.getMinutes() + minutes);
  return this };
if (!Date.addMonth) Date.prototype.addMonth = function(month) { this.setMonth(this.getMonth() + month);
  return this };
if (!Date.toPrtgString) Date.prototype.toPrtgString = function() {
  return this.getFullYear() + "-" + _Prtg.Util.padNumber(this.getMonth() + 1, 2) + "-" + _Prtg.Util.padNumber(this.getDate(), 2) + "-" + _Prtg.Util.padNumber(this.getHours(), 2) + "-" + _Prtg.Util.padNumber(this.getMinutes(), 2) + "-" + _Prtg.Util.padNumber(this.getSeconds(), 2) };
