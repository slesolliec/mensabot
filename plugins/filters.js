import Vue from 'vue'
const moment = require('moment');

function utc2cet(utcString) {
	return moment(utcString).format('DD/MM/YYYY');
}





Vue.filter('utc2cet',    utc2cet);
