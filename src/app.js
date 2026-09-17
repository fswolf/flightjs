/*!
 * ------------------------------------------------------------
 * FlightJS v0.1.0
 * Lightweight JavaScript framework for FlightPHP
 * 
 * Author: Ryan Autet
 * GitHub: https://github.com/fswolf/flightjs
 * License: MIT
 * ------------------------------------------------------------
 */
import { Routes, Configs } from "./routes.js";
import { Core } from "./core.js";

var ready = (callback) => {
	if (document.readyState !== "loading") callback();
	else document.addEventListener("DOMContentLoaded", callback);
}

ready(async () => { 
	const core = new Core();
	await core.start(Routes, Configs);
});
