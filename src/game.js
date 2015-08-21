(function() {
	'use strict';

	var VISIBLE_WIDTH = 16;
	var VISIBLE_HEIGHT = 11;

	/// 128 TILE SIZE

	var CANVAS_HEIGHT = 768;
	var CANVAS_WIDTH = 1028;
	var MAP_SIZE_X = 32;
	var MAP_SIZE_Y = 24;

	var TILE_SIZE = CANVAS_HEIGHT/(VISIBLE_HEIGHT+1); //
	var FONT_SIZE = TILE_SIZE/2;

	var OBJECT_SPEED = TILE_SIZE/8;

	/////////////////////////////////////////////////////////////////
	// Sprite/Graphics
	/////////////////////////////////////////////////////////////////

	function Sprite( file, cb ) {

		this.images = [];

		// init the sprite images
		var imageObj = new Image();
		imageObj.onload = cb;
		imageObj.src =file;
		this.images[0] = imageObj;

	}
	Sprite.prototype = {
		render: function(screen, sX, sY, sW, sH, dX, dY, dW, dH) {
			screen.drawImage(this.images[0], sX, sY, sW, sH, dX, dY, dW, dH );
		}
	};

	function Gfx( sprite, x, y, w, h ) {
		this.sprite = sprite;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	Gfx.prototype = {
		render: function(screen, x, y) {

			this.sprite.render(screen, this.x, this.y, this.w, this.h, x, y, TILE_SIZE, TILE_SIZE);

		}
	};
	function Font( sprite ) {
		this.letters = ''+
			'abcdefg'+
			'hijklmn'+
			'opqrstu'+
			'vwxyz?!'+
			':,.1234'+
			'567890';
		this.sprite = sprite;
	};
	Font.prototype = {
		posInSprite: function(letter) {
			var xstart = 64;
			var ystart = 0;
			// 7 letters per col
			var letterIdx = this.letters.indexOf(letter);
			if ( letterIdx >= 0 ) {
				// found the letter
				return {
					x: xstart + (Math.floor(letterIdx/7))*8,
					y: ystart + ((letterIdx%7)*8)
				};

			} else {
				return false;
			}
		},
		renderText: function(screen, text, x, y) {
			text = text.toLowerCase();
			var origX = x;
			for ( var i = 0, iLen = text.length; i < iLen; i++ ) {
				var chr = text.charAt(i);
				if ( chr === "\n" ) {
					y+=16;
					x = origX;
					continue;
				}
				var posInSprite = this.posInSprite(chr);
				if ( posInSprite ) {
					this.sprite.render(screen, posInSprite.x, posInSprite.y, 8, 8, x, y, FONT_SIZE, FONT_SIZE);
				}
				x+=FONT_SIZE;
			}
		}
	};



	/////////////////////////////////////////////////////////////////
	// Input
	/////////////////////////////////////////////////////////////////
	function VirtualKey() {
		this.isPressed = false;
		this.isDown = false;
		this.presses = 0;
		this.absorbs = 0;
	}
	VirtualKey.prototype = {
		toggle: function(pressed) {
			if ( pressed !== this.isDown ) {
				this.isDown = pressed;
			}
			if ( pressed ) {
				this.presses++;
			}
		},
		tick: function() {
			if ( this.absorbs < this.presses ) {
				this.absorbs++;
				this.isPressed = true;
			} else {
				this.isPressed = false;
			}
		}
	};

	function InputHandler() {
		this.KEYS = { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32 };

		this.keys = {};
		this.keys[this.KEYS.LEFT] = new VirtualKey();
		this.keys[this.KEYS.RIGHT] = new VirtualKey();
		this.keys[this.KEYS.UP] = new VirtualKey();
		this.keys[this.KEYS.DOWN] = new VirtualKey();
		this.keys[this.KEYS.SPACE] = new VirtualKey();

		var self = this;
		window.addEventListener('keydown', function(e) {
			self.toggle(e, true);
		});
		window.addEventListener('keyup', function(e) {
			self.toggle(e, false);
		});
	}
	InputHandler.prototype = {
		toggle: function(e, pressed) {
			if ( this.keys[e.keyCode] ) {
				this.keys[e.keyCode].toggle(pressed);
				e.preventDefault();
			}
		},
		tick: function() {
			for ( var idx in self.keys ) {
				if ( ! self.keys.hasOwnProperty(idx) ) {
					continue;
				}
				self.keys[idx].tick();
			}
		}
	};






	/////////////////////////////////////////////////////////////////
	// Entities
	/////////////////////////////////////////////////////////////////

	/* Basic Entity
	===============================================================*/
	function Entity( g, gfx, x, y, w, h ) {
		this.game = g;
		this.gfx = gfx;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.dirX = 0;
		this.dirY = 0;
		this.speed = 0;
		this.stepsPerTile = 1;
		this.substep = 0;
		this.isWalkable = false;
		this.isPushable = false;
	}
	Entity.prototype = {
		constructor: Entity.prototype.constructor,
		translatePos: function() {
			return {x: Math.round(this.x/TILE_SIZE, 10), y: Math.round(this.y/TILE_SIZE, 10)};
		},
		move: function() {
			this.x = this.x+this.dirX*this.speed;
			this.y = this.y+this.dirY*this.speed;
		},
		unmove: function() {
			this.x = this.x-this.dirX*this.speed;
			this.y = this.y-this.dirY*this.speed;
		}
	};


	/* The Player
	===============================================================*/
	function Player(g, x, y) {
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 16, 16, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.emeraldCount = 0;
		this.gfxRight = new Gfx(g.sprite, 32, 16, 16, 16);
		this.gfxLeft = new Gfx(g.sprite, 0, 32, 16, 16);
	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.constructor = Player;
	Player.prototype.render = function(context) {

		if ( this.dirX < 0 ) {
			this.gfxLeft.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else if ( this.dirX > 0 ) {
			this.gfxRight.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else {
			this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		}
	};

	/* Enemy
	===============================================================*/
	function Enemy(gfx){
	}
	Enemy.prototype = Object.create(Entity.prototype);
	Enemy.prototype.constructor = Enemy;

	/* Stone
	===============================================================*/
	function Stone(g, x, y){
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 0, 0, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.isFalling = false;
		this.wasFalling = false;
		this.isWalkable = false;
		this.isPushable = true;
	}
	Stone.prototype = Object.create(Entity.prototype);
	Stone.prototype.constructor = Stone;

	/* Bomb
	===============================================================*/
	function Bomb(g, x, y){
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 32, 0, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.isFalling = false;
		this.wasFalling = false;
		this.isWalkable = false;
		this.isPushable = true;
	}
	Bomb.prototype = Object.create(Entity.prototype);
	Bomb.prototype.constructor = Bomb;

	/* Grass
	 ===============================================================*/
	function Grass(g, x, y){
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 16, 0, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
	}
	Grass.prototype = Object.create(Entity.prototype);
	Grass.prototype.constructor = Grass;

	/* Emerald
	 ===============================================================*/
	function Emerald(g, x, y){
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 0, 16, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
	}
	Emerald.prototype = Object.create(Entity.prototype);
	Emerald.prototype.constructor = Emerald;

	/* Explosion
	===============================================================*/
	function Explosion(g, x, y) {
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 48, 0, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
		this.ticktick = 10;
	}
	Explosion.prototype = Object.create(Entity.prototype);
	Explosion.prototype.constructor = Explosion;

	/* Dummy
	 ===============================================================*/
	function Dummy(ref) {
		Entity.prototype.constructor.call(this, ref.game, null, ref.x, ref.y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = ref.isWalkable;
		this.ref = ref;
	}
	Dummy.prototype = Object.create(Entity.prototype);
	Dummy.prototype.constructor = Dummy;




	/////////////////////////////////////////////////////////////////
	// Game
	/////////////////////////////////////////////////////////////////


	/* The Game
	===============================================================*/
	function Game() {
		var self = this;
		this.canvas = document.getElementById('game');
		this.context = this.canvas.getContext('2d');
		this.context.mozImageSmoothingEnabled = false;
		this.context.webkitImageSmoothingEnabled = false;
		this.context.msImageSmoothingEnabled = false;
		this.context.imageSmoothingEnabled = false;
		this.font = null;

		this.renderStartX = 0;
		this.renderStartY = 0;

		//self.canvas.width  = 1024; //window.innerWidth;
		//self.canvas.height = 768; //window.innerHeight;

		this.inputHandler = new InputHandler();
		this.state = 'init';
		this.sprite = new Sprite('sprites.png', function() {
			self.state = 'game';
			self.font = new Font(self.sprite);
			self.init();
		}); // load sprite



		this.pendingExplodePositions = [];
		this.elements = [];

		for ( var j = 0; j < MAP_SIZE_Y; j++ ) {
			for ( var i = 0; i < MAP_SIZE_X; i++ ) {
				var rnd = Math.random();
				if ( rnd > 0.9 ) {
					this.elements.push(new Bomb(this, i*TILE_SIZE, j*TILE_SIZE));
				} else if ( rnd > 0.8 ) {
					this.elements.push(new Emerald(this, i*TILE_SIZE, j*TILE_SIZE));
				} else if ( rnd > 0.7 ) {
					this.elements.push(new Stone(this, i*TILE_SIZE, j*TILE_SIZE));
				} else {
					this.elements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
				}
			}
		}

		this.player = new Player(this, 0*TILE_SIZE, 0*TILE_SIZE);

		this.lastUpdate = new Date().getTime();
		var tick = function() {

			if ( self.state === 'init' ) {
				// do nothing
			} else if ( self.state ==='game' ) {

				self.handleInput();
				self.update();
				self.render();
			}

			requestAnimationFrame(tick);
		};

		tick();

	}
	Game.prototype = {
		setElementAtIndex: function(idx, el) {
			if ( this.elements.length > idx && idx >= 0 ) {
				this.elements[idx] = el;
			}
		},
		deleteElementAtIndex: function(idx) {
			if ( this.elements.length > idx && idx >= 0 ) {
				delete this.elements[idx];
				this.setElementAtIndex(idx, null);
			}
		},
		getElementAtPos: function(x, y) {
			var idx = y*MAP_SIZE_X+x;
			return this.elements[idx];
			/*
			var foundItem = null;
			this.elements.forEach(function(item, idx, arr) {
				if ( item === null ) {
					return;
				}
				var itemX = Math.round(item.x);
				var itemY = Math.round(item.y);
				if ( x === itemX && y === itemY ) {
					foundItem = item;
					return false;
				}
			});
			return foundItem;
			*/
		},

		drawBackground: function() {
			var self = this;
			self.context.fillRect(0,0, self.canvas.width, self.canvas.height);
		},
		handleInput: function(){
			var self = this;

			self.inputHandler.tick();


			if ( self.player.substep === 0 || self.player.substep === self.player.stepsPerTile ) {
				self.player.dirX = 0;
				self.player.dirY = 0;

				if ( self.inputHandler.keys[self.inputHandler.KEYS.UP].isDown ) {
					self.player.dirY = -1;
				} else if ( self.inputHandler.keys[self.inputHandler.KEYS.DOWN].isDown ) {
					self.player.dirY = 1;
				} else {
					self.player.dirY = 0;

					if ( self.inputHandler.keys[self.inputHandler.KEYS.LEFT].isDown ) {
						self.player.dirX = -1;
					} else if ( self.inputHandler.keys[self.inputHandler.KEYS.RIGHT].isDown ) {
						self.player.dirX = 1;
					} else {
						self.player.dirX = 0;
					}
				}
			}

		},
		update: function() {
			var self = this;


			var currentTime = new Date().getTime();
			if ( currentTime - self.lastUpdate <= 1000/60 ) {
				return;
			}




			self.lastUpdate = currentTime;
			// Update all explosions (may trigger new explosions

			var newPendingExplosions = [];
			self.pendingExplodePositions.forEach(function(item, idx, arr) {
				for ( var y = item.y-1; y <= item.y+1; y++ ) {
					for ( var x = item.x-1; x <= item.x+1; x++ ) {
						// check if we hit a bomb, if yes, explode them too
						var elIndex = y*MAP_SIZE_X+x;
						var el = self.elements[elIndex];
						if ( el instanceof Dummy ) {
							el = el.ref;
							if ( el instanceof Bomb ) {
								newPendingExplosions.push({x:x, y:y});
							}
							// delete original element
							var pos = el.translatePos();
							self.deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
							self.setElementAtIndex(elIndex, new Explosion(self, x*TILE_SIZE, y*TILE_SIZE));
						} else {
							if ( el === null ) {

							} else if ( el instanceof Bomb ) {
								newPendingExplosions.push({x:x, y:y});
							}
							self.setElementAtIndex(elIndex, new Explosion(self, x*TILE_SIZE, y*TILE_SIZE));
						}
					}
				}
			});
			self.pendingExplodePositions = newPendingExplosions;




			// update all elements ( they might start or stop falling )
			var playerPosBefore = self.player.translatePos();
			self.elements.forEach(function(item, idx, arr) {
				if ( item === null ) {
					return;
				}
				if ( item instanceof Explosion ) {
					item.ticktick--;
					if ( item.ticktick === 0 ) {
						self.deleteElementAtIndex(idx);
						return;
					}
				}
				var pos = item.translatePos();
				if ( item instanceof Stone || item instanceof Bomb ) {
					// get element below the stone:
					var elBelow = self.elements[(pos.y+1)*MAP_SIZE_X+pos.x];
					if ( elBelow === null
						&& item.substep === 0
						&& ( !(playerPosBefore.x === pos.x && playerPosBefore.y === pos.y+1) || item.wasFalling )
					) {
						// let the stone fall down
						item.dirY = 1;
						item.dirX = 0;
						item.isFalling = true;
						item.wasFalling = false;
						self.setElementAtIndex((pos.y+1)*MAP_SIZE_X+pos.x, new Dummy(item)); // item will fall there eventually!

					} else if ( (elBelow instanceof Stone ) && item.substep === 0 ) {

						var elLeft = self.getElementAtPos(pos.x-1, pos.y);
						var elLeftBelow = self.getElementAtPos(pos.x-1, pos.y+1);
						if ( elLeft === null
							&& elLeftBelow === null
							&& !(playerPosBefore.x === pos.x-1 && playerPosBefore.y === pos.y)
							&& !(playerPosBefore.x === pos.x-1 && playerPosBefore.y === pos.y+1)
							) {
							item.dirX = -1;
							item.dirY = 0;
							self.setElementAtIndex((pos.y)*MAP_SIZE_X+(pos.x-1), new Dummy(item)); // item will fall there eventually!
						} else {
							var elRight =  self.getElementAtPos(pos.x+1, pos.y);
							var elRightBelow = self.getElementAtPos(pos.x+1, pos.y+1);
							if ( elRight === null
								&& elRightBelow === null
								&& !(playerPosBefore.x === pos.x+1 && playerPosBefore.y === pos.y)
								&& !(playerPosBefore.x === pos.x+1 && playerPosBefore.y === pos.y+1)
								) {
								item.dirX = 1;
								item.dirY = 0;
								self.setElementAtIndex((pos.y)*MAP_SIZE_X+(pos.x+1), new Dummy(item)); // item will fall there eventually!
							}
						}

					}
				}

				if ( item instanceof Bomb && item.wasFalling ) {
					// create Explosion!
					for ( var y = pos.y-1; y <= pos.y+1; y++ ) {
						for ( var x = pos.x-1; x <= pos.x+1; x++ ) {
							// check if we hit a bomb, if yes, explode them too


							var elIndex = y*MAP_SIZE_X+x;
							var el = self.elements[elIndex];
							if ( el instanceof Dummy ) {
								el = el.ref;
								if ( el instanceof Bomb ) {
									newPendingExplosions.push({x:x, y:y});
								}
								// delete original element
								var pos = el.translatePos();
								self.deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
								self.setElementAtIndex(elIndex, new Explosion(self, x*TILE_SIZE, y*TILE_SIZE));
							} else {
								if ( el === null ) {

								} else if ( el instanceof Bomb ) {
									newPendingExplosions.push({x:x, y:y});
								}
								self.setElementAtIndex(elIndex, new Explosion(self, x*TILE_SIZE, y*TILE_SIZE));
							}
						}
					}
				}
				if (item.wasFalling) {
					item.wasFalling = false;
				}
			});

			self.elements.forEach(function(item, idx, arr) {
				if ( item === null ) {
					return;
				}
				if ( item.dirX === 0 && item.dirY === 0 ) {
					return;
				}

				item.move();
				item.substep++;
				if ( item.substep >= item.stepsPerTile ) {
					item.substep = 0;
					item.dirX = 0;
					item.dirY = 0;

					// stop falling
					if ( item instanceof Stone || item instanceof Bomb ) {
						if ( item.isFalling ) {
							item.isFalling = false;
							item.wasFalling = true;
						}
					}
					var pos = item.translatePos();
					var elIdx = pos.y*MAP_SIZE_X+pos.x;

					self.deleteElementAtIndex(idx);
					self.setElementAtIndex(elIdx, item);

				}
			});




			// check if at the position is something and that something is not already moving
			if ( self.player.dirX !== 0 || self.player.dirY !== 0 ) {
				self.player.move();

				// player moves each field in 8 steps
				self.player.substep++;
				if ( self.player.substep >= self.player.stepsPerTile ) {
					self.player.substep = 0;
				}
			}

			// player started moving. check if some other elements must move and check if the player can even move!
			if ( self.player.substep === 1 ) {

				var unmove = false;
				if ( self.player.dirX !== 0 ) {
					// moving horizontally
					var nextEl= self.elements[playerPosBefore.y*MAP_SIZE_X+(playerPosBefore.x+self.player.dirX)];
					var nextNextEl = self.elements[playerPosBefore.y*MAP_SIZE_X+(playerPosBefore.x+self.player.dirX+self.player.dirX)];

					// do we have to unmove the player?
					if ( typeof nextEl === 'undefined' ) {
						unmove = true;
					} else if ( nextEl === null || nextEl.isWalkable ) {
						// ok
					} else if ( nextEl.isPushable ) {
						// dont know yet, maybe the stone/bomb can be pushed
						if ( nextNextEl === null ) {
							// ok
							if ( nextEl.dirX === 0 && nextEl.dirY === 0 ) {
								nextEl.dirX = self.player.dirX;
							}
						} else {
							unmove = true;
						}
					} else {
						unmove = true;
					}
				} else if ( self.player.dirY !== 0 ) {
					// moving vertically
					var nextEl= self.elements[(playerPosBefore.y+self.player.dirY)*MAP_SIZE_X+playerPosBefore.x];
					//var nextNextEl = self.elements[(playerPosBefore.y+self.player.dirY+self.player.dirY)*MAP_SIZE_X+playerPosBefore.x];

					// do we have to unmove the player?
					if ( typeof nextEl === 'undefined' ) {
						unmove = true;
					} else if ( nextEl === null || nextEl.isWalkable ) {
						// ok
					} else {
						unmove = true;
					}
				}
				if ( unmove ) {
					// just dont move..
					self.player.unmove();
					self.player.substep = 0;
				}
			}


			// player pos to index:
			var playerPosAfter = self.player.translatePos();

			var elIndex = playerPosAfter.y*MAP_SIZE_X+playerPosAfter.x;
			var elAtPlayer = self.elements[elIndex];
			if ( elAtPlayer instanceof Grass ) {
				self.deleteElementAtIndex(elIndex);
				console.log('ate some grass');
			} else if ( elAtPlayer instanceof Emerald ) {

				self.deleteElementAtIndex(elIndex);
				self.player.emeraldCount++;
				console.log('got an emerald');
			}


		},

		drawElements: function() {
			var self=  this;

			self.renderStartX = self.player.x - VISIBLE_WIDTH*TILE_SIZE/2;
			self.renderStartY = self.player.y - VISIBLE_WIDTH*TILE_SIZE/2;
			if ( self.renderStartX < 0 ) {
				self.renderStartX = 0;
			}
			if ( self.renderStartY < 0 ) {
				self.renderStartY = 0;
			}
			if ( self.renderStartX+VISIBLE_WIDTH*TILE_SIZE > MAP_SIZE_X*TILE_SIZE ) {
				self.renderStartX = MAP_SIZE_X*TILE_SIZE - VISIBLE_WIDTH*TILE_SIZE;
			}
			if ( self.renderStartY+VISIBLE_HEIGHT*TILE_SIZE > MAP_SIZE_Y*TILE_SIZE ) {
				self.renderStartY = MAP_SIZE_Y*TILE_SIZE - VISIBLE_HEIGHT*TILE_SIZE;
			}

			this.elements.forEach(function(item, idx, arr) {
				if ( item === null ) {
					return;
				}
				if ( item.x < self.renderStartX-TILE_SIZE || item.x > self.renderStartX+VISIBLE_WIDTH*TILE_SIZE + TILE_SIZE ) {
					return;
				}
				if ( item.y < self.renderStartY-TILE_SIZE || item.y > self.renderStartY+VISIBLE_HEIGHT*TILE_SIZE + TILE_SIZE ) {
					return;
				}

				if ( ! item.gfx ) {
					return;
				}

				//console.log(item);
				item.gfx.render(
					self.context,
					item.x - self.renderStartX,
					item.y - self.renderStartY
				);
			});

			//this.font.renderText(context, 'hallo\n\nabcdefghi  jklmnopqrstuvwxyz', 50,50);
		},

		drawHud: function() {
			var self = this;
			var hudRightElement = new Gfx(self.sprite, 48, 16, 16, 16);
			var hudLeftElement = new Gfx(self.sprite, 48, 48, 16, 16);
			var hudCenterElement = new Gfx(self.sprite, 48, 32, 16, 16);

			for ( var i = 1; i < VISIBLE_WIDTH-1; i++ ) {
				hudCenterElement.render(self.context, i*TILE_SIZE, (VISIBLE_HEIGHT)*TILE_SIZE);
			}
			hudLeftElement.render(self.context, 0, (VISIBLE_HEIGHT)*TILE_SIZE);
			hudRightElement.render(self.context, (VISIBLE_WIDTH-1)*TILE_SIZE, (VISIBLE_HEIGHT)*TILE_SIZE);

			self.font.renderText(
				self.context,
				"Emeralds: "+ self.player.emeraldCount,
				FONT_SIZE/2,
				(VISIBLE_HEIGHT)*TILE_SIZE + (TILE_SIZE/2 - FONT_SIZE/2)
			);
		},
		render: function() {
			var self = this;

			// render everything
			self.drawBackground();
			self.drawElements();
			self.drawHud();
			self.player.render(self.context);
		},
		init: function() {
		},
		start: function() {
		},
		reset: function() {
		}
	};


	window.addEventListener('load', function() {
		new Game();
	});

})();