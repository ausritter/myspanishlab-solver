// This file contains method extensions to the built-in Array class.

/*
 * Array - unique method.
 * Returns a new array that is the same as the current one but with all of the duplicates removed.
 * NOTE: Does not work on objects because it uses the == operator and not .equals.
 */
Array.prototype.unique = function () {
	var r = [];
	o:for(var i = 0, n = this.length; i < n; i++) {
		for(var x = 0, y = r.length; x < y; x++) {
			if(r[x] == this[i]) {
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
}