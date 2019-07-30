define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();

	class Projection extends Node {

		constructor(index) {
			super(null, "π("+index+")", "mediumpurple1");
			this.index = index;
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				token.dataStack.push(CompData.PROJ + this.index + "");
				return nextLink;
			}
			else if (link.from == this.key) { 
				return this.findLinksInto(null)[0];
			}
		}

		copy() {
			var newNode = new Projection(this.index);
			return newNode;
		}

	}

	return Projection;
});