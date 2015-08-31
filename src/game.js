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
	var HALF_TILE_SIZE = TILE_SIZE/2;

	var FONT_SIZE = HALF_TILE_SIZE;
	var HALF_FONT_SIZE = FONT_SIZE/2;

	var OBJECT_SPEED = TILE_SIZE/8;

	var SPRITE_TILE_SIZE = 16;
	var SPRITE_FONT_SIZE = 8;

	// some key codes:
	var VK_SPACE = 32;
	var VK_LEFT = 37;
	var VK_UP = 38;
	var VK_RIGHT = 39;
	var VK_DOWN = 40;
	var VK_E = 69;
	var VK_M = 77;
	var VK_O = 79;
	var VK_P = 80;
	var VK_R = 82;
	var VK_S = 83;
	var VK_L = 76;
	var VK_T = 84;
	var VK_X = 88;
	var VK_RETURN = 13;
	var VK_ESCAPE = 27;
	var VK_BACKSPACE = 8;

	var INSTRUMENT_CYMBAL = 1;
	var INSTRUMENT_DRUM = 2;
	var INSTRUMENT_BASS = 3;
	var INSTRUMENT_WAVE = 4;
	var INSTRUMENT_BEEP = 5;
	var INSTRUMENTS = {};
	INSTRUMENTS[INSTRUMENT_CYMBAL] = jsfxr([3,,0.1787,,0.1095,0.502,,,,,,,,0.2868,,,,,1,,,0.1,,0.5]);
	INSTRUMENTS[INSTRUMENT_DRUM] = jsfxr([3,,0.1787,,0.1095,0.17,,-0.58,,,,,,0.2868,,,,,1,,,0.1,,0.5]);
	INSTRUMENTS[INSTRUMENT_BASS] = jsfxr([0,,0.1897,0.2618,1,0.12,,0.02,,,,,,0.4812,-0.1783,,,,1,,,0.132,,0.5]);
	INSTRUMENTS[INSTRUMENT_WAVE] = jsfxr([0,0,0.037985,0.506013,0.438539,0.598958,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0.4]);
	INSTRUMENTS[INSTRUMENT_BEEP] = jsfxr([0,0,0.037985,0.506013,0.438539,0.598958,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0.2]);

	var AUDIO_DEATH = 0;
	var AUDIO_BG_MUSIC = 1;
	var AUDIO_EMERALD = 2;
	var AUDIO_RUBY = 3;
	var AUDIO_EXPLOSION = 4;
	var AUDIO_OPENDOOR = 5;
	var AUDIO_STONE = 6;
	var AUDIO_WALK = 7;
	var AUDIO_REVERSE = 8;


	/////////////////////////////////////////////////////////////////
	// Numeric representation of the elements
	/////////////////////////////////////////////////////////////////
	var ELEMENT_GRASS = 0;
	var ELEMENT_STONE = 1;
	var ELEMENT_BOMB = 2;
	var ELEMENT_EMERALD = 3;
	var ELEMENT_RUBY = 4;
	var ELEMENT_LAVA = 5;
	var ELEMENT_DOOR = 6;
	var ELEMENT_WALL = 7;
	var ELEMENT_NULL = 8;
	var ELEMENT_EXPLOSION = 9;

	var ENEMY_STRIDER = 10;


	/////////////////////////////////////////////////////////////////
	// Strings used in the game
	/////////////////////////////////////////////////////////////////
	var STR_SAVE_MAP = 'Save map';
	var STR_LOAD_MAP = 'Load map';
	var STR_MENU_START_RANDOM_GAME = 'SPACE: Start random game';
	var STR_MENU_EDIT_MAP =          'E:     Edit Map';
	var STR_MENU_LOAD_MAP =          'L:     Load Map';
	var STR_NAME_COLON = 'Name: ';
	var STR_HINT_COLON = 'Hint: ';
	var STR_GEMS_COLON = 'Gems: ';
	var STR_GEM_TARGET_COLON = 'Gem Target: ';
	var STR_EDIT_HELP_1 = 'X: remove element   E: set element  O: fill map  P: clear map';
	var STR_EDIT_HELP_2 = 'SPACE: next element  T+Number: gem target  T+T: auto gem target';
	var STR_STATUS_TEXT_GAMEOVER = 'Game over...';
	var STR_STATUS_TEXT_WIN = 'A winner is you!';
	var STR_ERROR_UNABLE_TO_SAVE_MAP = 'Unable to save map.';
	var STR_HINT_PLEASE_ENTER_NAME = 'Please enter a name';
	var STR_SAVED_AS_SPACE = 'Saved as ';
	var STR_MSG_DOOR_OPENED = 'Door was opened!!';




	/////////////////////////////////////////////////////////////////
	// Javascript strings that would not be minified are defined once
	// Saves tons of bytes.
	/////////////////////////////////////////////////////////////////
	var UNDEF = 'undefined';
	var PROTO = 'prototype';
	var CONSTRUCTOR = 'constructor';



	/////////////////////////////////////////////////////////////////
	// Sprite/Graphics
	/////////////////////////////////////////////////////////////////

	function Sprite( file, cb ) {
		// init the sprite image
		this.image = new Image();
		this.image.onload = cb;
		this.image.src = file;
	}
	Sprite[PROTO] = {
		render: function(screen, sX, sY, sW, sH, dX, dY, dW, dH) {
			screen.drawImage(this.image, sX, sY, sW, sH, dX, dY, dW, dH );
		}
	};

	function Gfx( sprite, x, y, w, h ) {
		this.sprite = sprite;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	Gfx[PROTO] = {
		render: function(screen, destX, destY, shiftX, shiftY, TS) {
			var self = this;
			TS = TS || TILE_SIZE;
			if ( !shiftX && !shiftY ) {
				self.sprite.render(screen, this.x, this.y, this.w, this.h, destX, destY, TS, TS);
				return;
			}
			// wrap the sprite image

			shiftX = shiftX || 0;
			shiftY = shiftY || 0;

			var ratioX = TS / self.w;
			var ratioY = TS / self.h;

			var w1, w2, h1, h2;
			if ( shiftX ) {
				w2 = Math.abs(shiftX);
				w1 = self.w - w2;
			} else {
				w2 = self.w;
				w1 = self.w;
			}
			if ( shiftY ) {
				h2 = Math.abs(shiftY);
				h1 = self.h - h2;
			} else {
				h2 = self.h;
				h1 = self.h;
			}

			// render part 1
			self.sprite.render(
				screen,
				self.x + shiftX,
				self.y + shiftY,
				w1,
				h1,
				destX,
				destY,
				w1*ratioX,
				h1*ratioY
			);

			// render part 2
			self.sprite.render(
				screen,
				self.x,
				self.y,
				w2,
				h2,
				shiftX ? (destX + w1 * ratioX ) : destX,
				shiftY ? (destY + h1 * ratioY ) : destY,
				w2*ratioX,
				h2*ratioY
			);

		}
	};

	function Font( sprite ) {
		this.letters = ''+
			'abcdefg'+
			'hijklmn'+
			'opqrstu'+
			'vwxyz?!'+
			':,.1234'+
			'567890/'+
			'+"';
		this.sprite = sprite;
		// left upper corner of "letter" block in sprite
		this.x = 64;
		this.y = 0;

	}
	Font[PROTO] = {
		renderText: function(screen, text, x, y, FS) {
			FS = FS || FONT_SIZE;
			text = text.toLowerCase();
			var _x = x;
			var self = this;
			for ( var i = 0, iLen = text.length; i < iLen; i++ ) {
				var chr = text.charAt(i);
				if ( chr === "\n" ) {
					y+=SPRITE_FONT_SIZE*2;
					_x = x;
					continue;
				}
				// find pos in sprite:

				var letterIdx = self.letters.indexOf(chr);
				if ( letterIdx >= 0 ) {
					// found the letter
					self.sprite.render(
						screen,
						// 7 letters per col
						self.x + ((letterIdx/7) | 0)*8,
						self.y + (letterIdx%7)*8,
						SPRITE_FONT_SIZE,
						SPRITE_FONT_SIZE,
						_x,
						y,
						FS,
						FS
					);
				}
				_x+=FS;
			}
		}
	};





	/////////////////////////////////////////////////////////////////
	// Input
	/////////////////////////////////////////////////////////////////
	function VirtualKey() {
		var self = this;
		self.isPressed = false;
		self.isDown = false;
		self.presses = 0;
		self.absorbs = 0;
	}
	VirtualKey[PROTO] = {
		toggle: function(pressed) {
			var self = this;
			if ( pressed !== self.isDown ) {
				self.isDown = pressed;
			}
			if ( pressed ) {
				self.presses++;
			}
		},
		tick: function() {
			var self = this;
			if ( self.absorbs < self.presses ) {
				self.absorbs++;
				self.isPressed = true;
			} else {
				self.isPressed = false;
			}
		},
		reset: function() {
			var self = this;
			self.isPressed = false;
			self.isDown = false;
			self.presses = 0;
			self.absorbs = 0;
		}
	};

	function InputHandler() {
		var self = this;

		self.vk = {};

		// special keys are added here
		// normal letters and numbers are created on the fly
		self.vk[VK_LEFT] = new VirtualKey();
		self.vk[VK_RIGHT] = new VirtualKey();
		self.vk[VK_UP] = new VirtualKey();
		self.vk[VK_DOWN] = new VirtualKey();
		self.vk[VK_SPACE] = new VirtualKey();
		self.vk[VK_RETURN] = new VirtualKey();
		self.vk[VK_ESCAPE] = new VirtualKey();
		self.vk[VK_BACKSPACE] = new VirtualKey();

		window.addEventListener('keydown', function(e) {
			self.toggle(e, true);
		});
		window.addEventListener('keyup', function(e) {
			self.toggle(e, false);
		});
	}
	InputHandler[PROTO] = {
		toggle: function(e, pressed) {
			var keyCode = e.keyCode;
			var self = this;
			// 0-9 and a-z
			if ( !self.vk[keyCode] && keyCode >= 48 && keyCode <= 90 ) {
				self.vk[keyCode] = new VirtualKey();
			}
			if ( self.vk[keyCode] ) {
				self.vk[keyCode].toggle(pressed);
				e.preventDefault();
			}
		},
		tick: function() {
			Object.keys(this.vk).forEach(function(i) {
				this.vk[i].tick();
			}, this);
		},
		isDown: function(keyCode) {
			return this.vk[keyCode] && this.vk[keyCode].isDown;
		},
		isPressed: function(keyCode) {
			return this.vk[keyCode] && this.vk[keyCode].isPressed;
		},
		reset: function() {
			Object.keys(this.vk).forEach(function(i) {
				this.vk[i].reset();
			}, this);
		}
	};


	/////////////////////////////////////////////////////////////////
	// Audio
	/////////////////////////////////////////////////////////////////
	function AudioHandler() {
		this.sounds = {};
		this.sequences = {};
		this.isMuted = false;
	}
	AudioHandler[PROTO] = {

		mute: function( mute ) {
			var self = this;
			self.isMuted = mute;
			Object.keys(self.sequences).forEach(function(i) {
				self.sequences[i].mute(mute);
			});
		},

		hasSequence: function(key) {
			return !!this.sequences[key];
		},

		addSequence: function(key, sequencer) {
			this.sequences[key] = sequencer;
		},
		playSequence: function(key) {
			if ( ! this.sequences[key] ) {
				return;
			}
			this.sequences[key].play();
		},
		stopSequence: function(key) {
			if ( ! this.sequences[key] ) {
				return;
			}
			this.sequences[key].stop();
		},

		has: function(key) {
			return !!this.sounds[key];
		},
		/**
		 *
		 * @param key              Sound name / Key in the sound array
		 * @param simultanousCount How many sounds of this key can be played simultanously
		 *                         This should be a higher number for longer playing sounds.
		 * @param soundSettings    Sound settings for jsfxr
		 */
		add: function(key, simultanousCount, soundSettings) {

			var self = this;
			// create a new array with information about the sound for the given key
			self.sounds[key] = [];

			// foreach sound setting we have given for the key, push an entry
			soundSettings.forEach(function(item, idx) {
				self.sounds[key].push({
					current: 0,
					count: simultanousCount,
					pool: []
				});
				// push as many entries as we want
				for ( var i = 0; i < simultanousCount; i++ ) {
					var audio = new Audio();
					audio.src = jsfxr(item);
					self.sounds[key][idx].pool.push(audio);

					//this.sounds[key][idx].pool.push(item);
				}
			});
		},
		play: function(key) {
			// fetch the sound for the key
			var sound = this.sounds[key];
			if ( ! sound ) {
				return;
			}

			//var self = this;
			//sound.forEach(function(soundData, idx, arr) {
			//	self.soundFx.play(soundData.pool[soundData.current]);
			//
			//	// update current, so next time play is called, another instance of the sound (jsfxr) can be played
			//	soundData.current < soundData.count - 1 ? soundData.current++ : soundData.current = 0;
			//});

			// get one of the sounds for the specified key randomly
			var rand = sound.length > 1 ? ((Math.random()*sound.length) | 0) : 0;
			var soundData = sound[rand];

			// play the sound
			if ( !this.isMuted ) {
				soundData.pool[soundData.current].play();
			}

			//sound.forEach(function(soundData, idx, arr) {
			//	self.soundFx.play(soundData.pool[soundData.current]);
			//
			//	// update current, so next time play is called, another instance of the sound (jsfxr) can be played
			//	soundData.current < soundData.count - 1 ? soundData.current++ : soundData.current = 0;
			//});


			// update current, so next time play is called, another instance of the sound (jsfxr) can be played
			soundData.current < soundData.count - 1 ? soundData.current++ : soundData.current = 0;
		}
	};



	/////////////////////////////////////////////////////////////////
	// Entities
	/////////////////////////////////////////////////////////////////

	/* Basic Entity
	===============================================================*/
	function Entity( g, gfx, x, y, w, h ) {
		var self = this;
		self.game = g;
		self.gfx = gfx;
		self.x = x;
		self.y = y;
		self.w = w;
		self.h = h;
		self.dirX = 0;
		self.dirY = 0;
		self.speed = 0;
		self.stepsPerTile = 1;
		self.substep = 0;
		self.isWalkable = false;
		self.isPushable = false;
		self.isDeadly = false;
		self.isFalling = false;
		self.wasFalling = false;
	}
	Entity[PROTO].getActualPosition = function() {
		return {
			x: (this.x/TILE_SIZE + 0.5) | 0,
			y: (this.y/TILE_SIZE + 0.5) | 0
		};
	};
	Entity[PROTO].move = function() {
		var self = this;
		self.x = self.x+self.dirX*self.speed;
		self.y = self.y+self.dirY*self.speed;
	};
	Entity[PROTO].unmove = function() {
		var self = this;
		self.x = self.x-self.dirX*self.speed;
		self.y = self.y-self.dirY*self.speed;
	};
	Entity[PROTO].render = function(context) {
		var self = this;
		self.gfx.render(context, self.x - self.game.renderStartX, self.y - self.game.renderStartY);
	};


	/* The Player
	===============================================================*/
	function Player(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, null, x, y, TILE_SIZE, TILE_SIZE);
		self.speed = OBJECT_SPEED;
		self.stepsPerTile = TILE_SIZE/self.speed;
		self.substep = 0; // max TILE_SIZE/this.speed
		self.gemCount = 0;

		self.gfx = new Gfx(g.sprite, 16, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		self.gfxRight = [new Gfx(g.sprite, 32, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self.gfxLeft = [new Gfx(g.sprite, 0, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 0, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self.gfxDown = [new Gfx(g.sprite, 16, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self.gfxUp = [new Gfx(g.sprite, 0, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
	}
	Player[PROTO] = Object.create(Entity[PROTO]);
	Player[PROTO][CONSTRUCTOR] = Player;
	Player[PROTO].render = function(context) {

		var self = this;
		var screenX = self.x - self.game.renderStartX;
		var screenY = self.y - self.game.renderStartY;

		if (  self.game.state === Game.STATE_GAME || self.game.state === Game.STATE_EDIT ) {
			var frame = self.game.ticks % 24 < 12 ? 1 : 0;
			if ( self.dirX < 0 ) {
				self.gfxLeft[frame].render(context, screenX, screenY);
			} else if ( self.dirX > 0 ) {
				self.gfxRight[frame].render(context, screenX, screenY);
			} else if ( self.dirY > 0 ) {
				self.gfxDown[frame].render(context, screenX, screenY);
			} else if ( self.dirY < 0 ) {
				self.gfxUp[frame].render(context, screenX, screenY);
			} else {
				self.gfx.render(context, screenX, screenY);
			}
		} else {
			self.gfx.render(context, screenX, screenY);
		}
	};

	/* Enemy
	===============================================================*/
	function Enemy(g, gfx, x, y, w, h) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, gfx, x, y, w, h);
		this.isDeadly = true;
	}
	Enemy[PROTO] = Object.create(Entity[PROTO]);
	Enemy[PROTO][CONSTRUCTOR] = Enemy;
	Enemy[PROTO].render = function(context) {
		var self = this;
		var screenX = self.x - self.game.renderStartX;
		var screenY = self.y - self.game.renderStartY;
		self.gfx.render(context, screenX, screenY);
	};

	/* Strider
	 ===============================================================*/
	function Strider(g, x, y) {
		var self = this;
		Enemy[PROTO][CONSTRUCTOR].call(self, g, g.elementGraphics[ENEMY_STRIDER], x, y, TILE_SIZE, TILE_SIZE);
		self.speed = OBJECT_SPEED;
		self.stepsPerTile = TILE_SIZE/self.speed;
		self.substep = 0; // max TILE_SIZE/this.speed
		self.gemCount = 0;
		self.ticktick = 0;
	}
	Strider[PROTO] = Object.create(Enemy[PROTO]);
	Strider[PROTO][CONSTRUCTOR] = Strider;
	Strider[PROTO].update = function() {

		var self = this;
		if ( self.ticktick > 0 ) {
			self.ticktick--;
			return;
		}
		if ( self.dirX < 0 ) {
			self.dirY = 0;
			// check if a not null tile is left of this

		} else if ( self.dirX > 0 ) {
			self.dirY = 0;
		} else if ( self.dirY < 0 ) {
			self.dirX = 0;
		} else if ( self.dirY > 0 ) {
			self.dirX = 0;
		}

		if ( self.dirX === 0 && self.dirY === 0 ) {
			var x = Math.random();
			if ( x < 0.25 ) {
				self.dirX = 1;
			} else if ( x < 0.5 ) {
				self.dirX = -1;
			} else if ( x < 0.75 ) {
				self.dirY = 1;
			} else {
				self.dirY = -1;
			}
		}

		var posBefore = self.getActualPosition();

		if ( self.dirX !== 0 || self.dirY !== 0 ) {

			self.move();

			// player moves each field in 8 steps
			self.substep = self.substep < self.stepsPerTile-1 ? self.substep+1 : 0;

		}

		// check if must unmove

		var unmove = false;
		if ( self.substep === 1 ) {

			// player started moving. lets see if he hits the bounds of the map, if yes, then unmove and set substep to 0;
			if ( ( self.x <= 0 && self.dirX < 0 )
				|| ( self.x >= MAP_SIZE_X*TILE_SIZE-TILE_SIZE && self.dirX > 0 )
				|| ( self.y <= 0 && self.dirY < 0 )
				|| ( self.y >= MAP_SIZE_Y*TILE_SIZE-TILE_SIZE && self.dirY > 0 )
			) {
				unmove = true;
			} else if ( self.dirX !== 0 ) {

				if ( self.game.state === Game.STATE_GAME ) {
					// check left right elements if player can move there
					// moving horizontally
					var nextEl= self.game.getElementAtPos(posBefore.x+self.dirX, posBefore.y);

					// do we have to unmove the player?
					if ( typeof nextEl === UNDEF ) {
						unmove = true;
					} else if ( nextEl === null ) {
						// ok
					} else {
						unmove = true;
					}
				}
			} else if ( self.dirY !== 0 ) {
				if ( self.game.state === Game.STATE_GAME ) {
					// check top/bottom elements
					// moving vertically

					var nextEl= self.game.getElementAtPos(posBefore.x, posBefore.y+self.dirY);

					// do we have to unmove the player?
					if ( typeof nextEl === UNDEF ) {
						unmove = true;
					} else if ( nextEl === null ) {
						// ok
					} else {
						unmove = true;
					}
				}
			}

		}

		if ( unmove ) {
			// just dont move..
			self.unmove();
			self.substep = 0;

			// this also means the unit hit some kind of obstacle..
			// stop moving and stay there for some ticks:
			self.ticktick = 10;
			self.dirX = 0;
			self.dirY = 0;

		}

	};



	/* Stone
	===============================================================*/
	function Stone(g, x, y){
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, g.elementGraphics[ELEMENT_STONE], x, y, TILE_SIZE, TILE_SIZE);
		self.speed = OBJECT_SPEED;
		self.stepsPerTile = TILE_SIZE/self.speed;
		self.substep = 0; // max TILE_SIZE/self.speed
		self.isWalkable = false;
		self.isPushable = true;
	}
	Stone[PROTO] = Object.create(Entity[PROTO]);
	Stone[PROTO][CONSTRUCTOR] = Stone;

	/* Bomb
	===============================================================*/
	function Bomb(g, x, y){
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, g.elementGraphics[ELEMENT_BOMB], x, y, TILE_SIZE, TILE_SIZE);
		self.speed = OBJECT_SPEED;
		self.stepsPerTile = TILE_SIZE/self.speed;
		self.substep = 0; // max TILE_SIZE/self.speed
		self.isWalkable = false;
		self.isPushable = true;
	}
	Bomb[PROTO] = Object.create(Entity[PROTO]);
	Bomb[PROTO][CONSTRUCTOR] = Bomb;

	/* Grass
	 ===============================================================*/
	function Grass(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_GRASS], x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
	}
	Grass[PROTO] = Object.create(Entity[PROTO]);
	Grass[PROTO][CONSTRUCTOR] = Grass;


	/* Wall
	 ===============================================================*/
	function Wall(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_WALL], x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = false;
	}
	Wall[PROTO] = Object.create(Entity[PROTO]);
	Wall[PROTO][CONSTRUCTOR] = Wall;


	/* Gem
	 ===============================================================*/
	function Gem(g, gfx, x, y, w, h) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, gfx, x, y, w, h);
		self.isWalkable = true;
		self.value = 0;
		self.collectSound = '';
	}
	Gem[PROTO] = Object.create(Entity[PROTO]);
	Gem[PROTO][CONSTRUCTOR] = Gem;
	Gem[PROTO].playCollectSound = function() {
		var self = this;
		self.game.audioHandler.play(self.collectSound);
		self.game.audioHandler.playSequence(self.collectSound);
	};

	/* Emerald
	 ===============================================================*/
	function Emerald(g, x, y){
		var self = this;
		Gem[PROTO][CONSTRUCTOR].call(self, g, g.elementGraphics[ELEMENT_EMERALD], x, y, TILE_SIZE, TILE_SIZE);
		self.value = 1;
		self.collectSound = AUDIO_EMERALD;
		g.gemCount+=self.value;

		// emerald sound
		if ( !g.audioHandler.has(AUDIO_EMERALD) ) {
			g.audioHandler.add(AUDIO_EMERALD, 5, [
				[0,,0.0881,0.4996,0.2593,0.8492,,,,,,0.2308,0.6901,,,,,,1,,,,,0.5]
			]);
		}


	}
	Emerald[PROTO] = Object.create(Gem[PROTO]);
	Emerald[PROTO][CONSTRUCTOR] = Emerald;

	/* Ruby
	 ===============================================================*/
	function Ruby(g, x, y){
		var self = this;
		Gem[PROTO][CONSTRUCTOR].call(self, g, g.elementGraphics[ELEMENT_RUBY], x, y, TILE_SIZE, TILE_SIZE);
		self.value = 5;
		self.collectSound = AUDIO_RUBY;
		g.gemCount+=self.value;

		// ruby sound
		if ( !g.audioHandler.hasSequence(AUDIO_RUBY) ) {
			g.audioHandler.addSequence(AUDIO_RUBY, new Sequencer({
				loopSpeed: 100,
				instruments: INSTRUMENTS,
				loops: [],
				song: [
					[{n:INSTRUMENT_BEEP,p:1.24}],
					[{n:INSTRUMENT_BEEP,p:1.3}],
					[{n:INSTRUMENT_BEEP,p:1.6}]
				],
				loop: false
			}));
		}
	}
	Ruby[PROTO] = Object.create(Gem[PROTO]);
	Ruby[PROTO][CONSTRUCTOR] = Ruby;

	/* Explosion
	===============================================================*/
	function Explosion(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, new Gfx(g.sprite, 48, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), x, y, TILE_SIZE, TILE_SIZE);
		self.isWalkable = true;
		self.ticktick = 10;
		self.isDeadly = true;
	}
	Explosion[PROTO] = Object.create(Entity[PROTO]);
	Explosion[PROTO][CONSTRUCTOR] = Explosion;

	/* Lava
	===============================================================*/
	function Lava(g, x, y) {
		Entity[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_LAVA], x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
		this.isDeadly = true;
	}
	Lava[PROTO] = Object.create(Entity[PROTO]);
	Lava[PROTO][CONSTRUCTOR] = Lava;
	Lava[PROTO].render = function(context) {
		var self = this;
		var shift = 0;
		if ( self.game.state === Game.STATE_GAME || self.game.state === Game.STATE_EDIT ) {
			shift = self.game.ticks % 256 / 32 | 0;
		}
		self.gfx.render(context, self.x - self.game.renderStartX, self.y - self.game.renderStartY, shift);
	};

	/* Dummy
	 ===============================================================*/
	function Dummy(ref) {
		Entity[PROTO][CONSTRUCTOR].call(this, ref.game, null, ref.x, ref.y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = ref.isWalkable;
		this.ref = ref;
	}
	Dummy[PROTO] = Object.create(Entity[PROTO]);
	Dummy[PROTO][CONSTRUCTOR] = Dummy;

	/* Door
	===================================================================*/
	function Door(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, null, x, y, TILE_SIZE, TILE_SIZE);
		self.isWalkable = false;
		self.isOpen = false;
		self.stepsPerTile = TILE_SIZE/OBJECT_SPEED;

		self.gfx = g.elementGraphics[ELEMENT_DOOR];
		self.gfxOpen = [new Gfx(self.game.sprite, 32, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(self.game.sprite, 32, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
	}
	Door[PROTO] = Object.create(Entity[PROTO]);
	Door[PROTO][CONSTRUCTOR] = Door;
	Door[PROTO].open = function() {
		this.isOpen = true;
		this.isWalkable = true;
	};
	Door[PROTO].render = function(context) {
		var self = this;
		if ( (self.game.state === Game.STATE_GAME || self.game.state === Game.STATE_EDIT) && self.isOpen ) {
			var frame = self.game.ticks % 32 < 16 ? 1 : 0;
			//self.frame = ( self.substep > self.stepsPerTile / 2 ) ? 1 : 0;
			self.gfxOpen[frame].render(context, self.x - self.game.renderStartX, self.y - self.game.renderStartY);
		} else {
			self.gfx.render(context, self.x - self.game.renderStartX, self.y - self.game.renderStartY);
		}
	};


	/* Door
	 ===================================================================*/
	function Message(g, text, ticktick) {
		this.game = g;
		this.text = text;
		this.ticktick = ticktick;
	}
	Message[PROTO].render = function(context, msgIndex) {
		this.game.font.renderText(
			context,
			this.text,
			VISIBLE_WIDTH*HALF_TILE_SIZE - this.text.length*HALF_FONT_SIZE,
			HALF_FONT_SIZE+msgIndex*(FONT_SIZE+HALF_FONT_SIZE)
		);
	};


	/////////////////////////////////////////////////////////////////
	// Game
	/////////////////////////////////////////////////////////////////


	/* The Game
	===============================================================*/
	function Game() {
		var self = this;
		self.canvas = document.getElementById('g');
		self.context = self.canvas.getContext('2d');
		self.context.mozImageSmoothingEnabled = false;
		self.context.webkitImageSmoothingEnabled = false;
		self.context.msImageSmoothingEnabled = false;
		self.context.imageSmoothingEnabled = false;
		self.font = null;
		self.ticks = 0;

		self.startTime = 0;
		self.renderStartX = 0;
		self.renderStartY = 0;

		self.messages = [];

		self.isReversed = false;
		self.isMuted = false;

		self.enemies = [];

		self.inputHandler = new InputHandler();
		self.audioHandler = new AudioHandler();
		self.prevState = null;
		self.state = Game.STATE_INIT;


		self.editAwaitingGemTarget = false;
		self.editCurrentMapName = '';
		self.loadSaveMapHint = false;
		self.editCurrentElement = ELEMENT_GRASS;
		self.allEditElements = [
			ELEMENT_GRASS,
			ELEMENT_STONE,
			ELEMENT_BOMB,
			ELEMENT_EMERALD,
			ELEMENT_RUBY,
			ELEMENT_LAVA,
			ELEMENT_DOOR,
			ELEMENT_WALL,
			ENEMY_STRIDER
		];

		self.elementGraphics = [];

		self.sprite = new Sprite('sprites.png', function() {
			self.changeState(Game.STATE_MENU);
			self.font = new Font(self.sprite);

			self.initGraphics();
		}); // load sprite
		self.initAudio();

		self.lastUpdate = new Date().getTime();
		var tick = function() {

			self.ticks++;

			if ( self.state === Game.STATE_INIT ) {
				// do nothing
			} else if ( self.state === Game.STATE_MENU
				|| self.state === Game.STATE_SAVEMAP
				|| self.state === Game.STATE_LOADMAP
				) {

				self.handleInput();
				self.render();

			} if ( self.state === Game.STATE_EDIT
				|| self.state === Game.STATE_GAME
				) {

				self.handleInput();
				self.update();
				self.render();

			} else if ( self.state === Game.STATE_GAMEOVER
				|| self.state === Game.STATE_WON
				) {
				self.handleInput();
			}

			requestAnimationFrame(tick);
		};

		tick();

	}
	Game.STATE_INIT = 0;
	Game.STATE_MENU = 4;
	Game.STATE_GAME = 1;
	Game.STATE_WON = 2;
	Game.STATE_GAMEOVER = 3;
	Game.STATE_EDIT = 5;
	Game.STATE_SAVEMAP = 6;
	Game.STATE_LOADMAP = 7;

	Game[PROTO] = {
		initAudio: function() {
			var self = this;

			// Predefined loops. Saves duplication in the song.

			// instruments have numbers 1 - ....
			// loops have numbers 101 - ....
			var DRUMLOOP = 101;
			var loops = {};
			loops[DRUMLOOP] = [
				[],
				[],
				[INSTRUMENT_CYMBAL],
				[]
			];
			// The song! Put instruments/loops in here.
			var song = [
				[DRUMLOOP, INSTRUMENT_WAVE],
				[{n:INSTRUMENT_WAVE,p:1.06}],
				[],
				[{n:INSTRUMENT_WAVE,p:1.06}],

				[DRUMLOOP, {n:INSTRUMENT_WAVE, p: 1}],
				[],
				[],
				[{n:INSTRUMENT_WAVE,p:1.24}],

				[DRUMLOOP],
				[{n:INSTRUMENT_WAVE,p:1.3}],
				[],
				[],

				[DRUMLOOP, INSTRUMENT_BASS],
				[],
				[],
				[],

				[DRUMLOOP, INSTRUMENT_BASS],
				[],
				[],
				[],

				[DRUMLOOP],
				[{n:INSTRUMENT_WAVE,p:0.88}],
				[{n:INSTRUMENT_WAVE,p:0.94}],
				[],

				[DRUMLOOP],
				[{n:INSTRUMENT_WAVE,p:0.94}],
				[{n:INSTRUMENT_WAVE,p:0.88}],
				[],

				[DRUMLOOP],
				[],
				[],
				[],

				[DRUMLOOP, INSTRUMENT_BASS],
				[],
				[],
				[],

				[DRUMLOOP, INSTRUMENT_BASS],
				[],
				[],
				[],

				[DRUMLOOP],
				[],
				[],
				[]
			];

			// Fire up a sequencer with all of the above
			self.audioHandler.addSequence(AUDIO_BG_MUSIC, new Sequencer({
				loopSpeed: 250, // milliseconds per beat
				instruments: INSTRUMENTS, // The Audio elements
				loops: loops, // Loops
				song: song, // The actual song
				loop: true, // Loop over and over
				buffer: 1.4 // seconds buffer. ~min Chrome lets us have in a background tab
			}));

			// emerald sound
			self.audioHandler.add(AUDIO_EXPLOSION, 5, [
				[3,,0.131,0.5546,0.4945,0.1142,,,,,,,,,,0.6184,-0.1018,-0.1237,1,,,,,0.5]
			]);
			// open door
			self.audioHandler.add(AUDIO_OPENDOOR, 1, [
				[1,,0.2125,,0.4813,0.4889,,0.2423,,,,,,,,0.7641,,,1,,,,,0.4935]
			]);

			// stone falls to the ground
			self.audioHandler.add(AUDIO_STONE, 5, [
				[3,,0.1535,0.2135,0.0535,0.0535,,-0.2463,,,,,,,,,0.0328,-0.1877,0.8134,,,,,0.4935]
			]);

			self.audioHandler.add(AUDIO_WALK, 1, [
				//[10, 0, 0.1, "sine", 0.2, 0, 0, 40, false, 0, 20,,]
				[3,,0.1017,0.0535,0.0782,0.0735,,-0.536,,,,,,,,,,,1,,,0.0436,,0.2735],
			]);

			self.audioHandler.add(AUDIO_REVERSE, 2, [
				[2,,0.175,,0.4147,0.3131,,0.2175,,,,,,,,0.7216,,,1,,,,,0.2735]
			]);

			self.audioHandler.add(AUDIO_DEATH, 1, [
				//[3,0.0137,0.1196,0.0357,0.7666,0.5988,,-0.541,-0.0004,,,-0.7069,,-0.5796,-0.0053,0.8313,-0.1972,-0.7011,0.9901,0.3907,-0.1717,,0.5852,0.5]
				//[3,0.1405,0.01,0.3854,0.9984,0.0726,,,0.005,,0.1376,0.7791,0.8835,0.8931,-0.0015,0.383,-0.1131,-0.3126,0.4644,0.6286,0.1435,,0.1538,0.5]
				[3,,0.1943,0.6007,0.4404,0.5443,,-0.347,,,,,,,,0.3375,,,1,,,,,0.5]
			]);

			//self.audioHandler.addSequence( 'deathsong', new Sequencer({
			//	loopSpeed: 400,
			//	instruments: {
			//		c: jsfxr([1,,0.1417,,0.3735,0.1865,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		d: jsfxr([1,,0.1417,,0.3735,0.1935,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		e: jsfxr([1,,0.1417,,0.4065,0.2065,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		f: jsfxr([1,,0.1417,,0.4065,0.2165,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		g: jsfxr([1,,0.1417,,0.4065,0.2265,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		a: jsfxr([1,,0.1417,,0.4065,0.2365,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		h: jsfxr([1,,0.1417,,0.4065,0.2465,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		c2: jsfxr([1,,0.1417,,0.4065,0.2565,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		cymbal: self.audioHandler.instruments.cymbal,
			//		//drum: jsfxr([1,,0.1787,,0.3095,0.17,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		//drum: jsfxr([1,,0.1417,,0.4065,0.2565,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		bass: self.audioHandler.instruments.bass,
			//		drum: self.audioHandler.instruments.drum,
			//		wave: self.audioHandler.instruments.wave
			//	},
			//	loops: {
			//		bestloop: [
			//			['c'],
			//			['d'],
			//			['g'],
			//			['f'],
			//			['e'],
			//			['a'],
			//			[''],
			//			['g']
			//		],
			//		otherloop: [
			//			['drum'],
			//			[],
			//			[],
			//			[]
			//		]
			//	},
			//	song: [
			//		['bestloop', 'otherloop'],
			//		[],
			//		[],
			//		[],
			//		['otherloop'],
			//		[],
			//		['wave'],
			//		[],
			//		['bestloop', 'otherloop'],
			//		[],
			//		[],
			//		[],
			//		['otherloop'],
			//		[],
			//		['wave'],
			//		[],
			//		['bestloop', 'otherloop'],
			//		[],
			//		['wave'],
			//		[],
			//		['otherloop'],
			//		[],
			//		['h', 'wave'],
			//		[],
			//		['bestloop', 'otherloop'],
			//		[],
			//		['wave'],
			//		[],
			//		['otherloop'],
			//		[],
			//		[],
			//		[],
			//	],
			//	loop: true
			//}));
			//self.audioHandler.playSequence('deathsong');
		},
		initGraphics: function() {
			var self = this;
			self.elementGraphics = {};
			self.elementGraphics[ELEMENT_GRASS] = new Gfx(self.sprite, 16, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_STONE] = new Gfx(self.sprite, 0, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_BOMB] = new Gfx(self.sprite, 32, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_EMERALD] = new Gfx(self.sprite, 0, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_RUBY] = new Gfx(self.sprite, 0, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_LAVA] = new Gfx(self.sprite, 48, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_DOOR] = new Gfx(self.sprite, 32, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_WALL] = new Gfx(self.sprite, 32, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);

			self.elementGraphics[ENEMY_STRIDER] = new Gfx(self.sprite, 48, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		},
		changeState: function( toState ) {
			var self = this;
			self.prevState = self.state;
			self.state = toState;

			// reset input handler to stop taking key presses/downs to another state
			self.inputHandler.reset();
		},
		randomMap: function() {

			//todo: should just fill an array with letters and then use readMap on the array
			// then set the gem target to 0.75 of gem count afterwards

			var obj = {
				map: [],
				gemTarget: 0,
				playerX: 0,
				playerY: 0
			};

			obj.map.push(ELEMENT_GRASS);
			for ( var i = 1; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
				// grass at player pos
				var rnd = Math.random();
				if ( rnd > 0.99 ) {
					obj.map.push(ELEMENT_RUBY);
				} else if ( rnd > 0.97 ) {
					obj.map.push(ELEMENT_NULL);
				} else if ( rnd > 0.9 ) {
					obj.map.push(ELEMENT_BOMB);
				} else if ( rnd > 0.8 ) {
					obj.map.push(ELEMENT_EMERALD);
				} else if ( rnd > 0.7 ) {
					obj.map.push(ELEMENT_STONE);
				} else if ( rnd > 0.35 ) {
					obj.map.push(ELEMENT_GRASS);
				} else {
					obj.map.push(ELEMENT_LAVA);
				}
			}

			// generate a door at a random position
			var rand = Math.random()*MAP_SIZE_X*MAP_SIZE_Y | 0;
			obj.map[rand] = ELEMENT_DOOR;

			this.readMap(obj);

			this.gemTarget = (this.gemCount * 0.75) | 0;

		},
		readMap: function(obj) {
			var self = this;
			self.enemies = [];
			self.elements = [];
			self.rElements = [];
			self.gemCount = 0;

			obj.map.forEach(function(item, i) {
				self.elements.push(null);
				self.rElements.push(null);
				self.setElementAtIndexByCode(i, obj.map[i]);
			});

			self.gemTarget = obj.gemTarget || self.gemCount;
			self.player = new Player(self, obj.playerX*TILE_SIZE, obj.playerY*TILE_SIZE);
		},
		loadMap: function(mapName) {
			try {
				//TODO: maybe check if localStorage can be used.
				return JSON.parse(localStorage.getItem('map-'+mapName.toLowerCase()));
			} catch( e ) {
				return false;
			}

		},
		saveMap: function( mapName ) {
			var self = this;
			var pos = self.player.getActualPosition();
			var enemies = [];
			var map = self.elements.map(self.elementToElementCode);
			self.enemies.forEach(function(enemy) {
				// set enemies on the map object
				var p = enemy.getActualPosition();
				var idx = p.y*MAP_SIZE_X+p.x;
				map[idx] = self.elementToElementCode(enemy);
			});
			//TODO: check if localStorage can be used.
			localStorage.setItem('map-'+mapName.toLowerCase(), JSON.stringify({
				// note: elements.map = function. not a map of self game
				map: map,
				gemTarget: self.gemTarget,
				playerX: pos.x,
				playerY: pos.y
			}));
			return true;
		},
		setElementAtIndexByCode: function(idx, elCode, remvoveEnemy) {
			this.setElementAtIndex(
				idx,
				this.elementCodeToElement(elCode, (idx%MAP_SIZE_X) * TILE_SIZE, parseInt(idx/MAP_SIZE_X, 10) * TILE_SIZE),
				remvoveEnemy
			);
		},
		addEnemy: function( enemy) {
			var self = this;
			self.enemies.push(enemy);
		},
		setElementAtIndex: function(idx, el, removeEnemy) {
			var self = this;

			if ( self.elements.length <= idx || idx < 0 ) {
				return;
			}

			var rel = null;
			var actualX = (idx%MAP_SIZE_X);
			var actualY = parseInt(idx/MAP_SIZE_X, 10);
			var posX = actualX * TILE_SIZE;
			var posY = actualY * TILE_SIZE;

			if ( removeEnemy ) {
				self.enemies.forEach(function(enemy, idx, arr) {
					var ePos = enemy.getActualPosition();
					if ( ePos.x === actualX && ePos.y === actualY ) {
						arr.splice(idx, 1);
					}
				});
			}

			if ( el instanceof Enemy ) {
				self.addEnemy(el);
				el = null;
			}


			if ( el === null ) {
				rel = null;
			} else if ( el instanceof Lava ) {
				rel = new Grass(self, posX, posY);
			} else if ( el instanceof Grass ) {
				rel = new Lava(self, posX, posY);
			} else if ( el instanceof Bomb ) {
				rel = new Ruby(self, posX, posY);
			} else if ( el instanceof Stone ) {
				rel = new Emerald(self, posX, posY);
			} else if ( el instanceof Ruby ) {
				rel = new Bomb(self, posX, posY);
			} else if ( el instanceof Emerald ) {
				rel = new Stone(self, posX, posY);
			} else if ( el instanceof Explosion ) {
				rel = new Explosion(self, posX, posY); // explosion are explosion
			} else if ( el instanceof Door ) {
				rel = new Door(self, posX, posY); // door are door
			} else if ( el instanceof Wall ) {
				rel = new Wall(self, posX, posY); // door are door
			}

			if ( self.isReversed ) {
				self.elements[idx] = rel;
				self.rElements[idx] = el;
			} else {
				self.elements[idx] = el;
				self.rElements[idx] = rel;
			}
		},
		deleteElementAtIndex: function(idx) {

			var self = this;
			if ( self.elements.length <= idx || idx < 0 ) {
				return;
			}

			var el = self.elements[idx];
			// remove all dummies
			self.elements.forEach(function(item, i) {
				if ( item instanceof Dummy && item.ref === el ) {
					delete self.elements[i];
					self.setElementAtIndex(i, null);
				}
			});
			var rEl = self.rElements[idx];
			// remove all dummies
			self.rElements.forEach(function(item, i) {
				if ( item instanceof Dummy && item.ref === rEl ) {
					delete self.rElements[i];
					self.setElementAtIndex(i, null);
				}
			});

			delete self.elements[idx];
			//delete this.rElements[idx];
			self.setElementAtIndex(idx, null);
		},
		getElementAtPos: function(x, y) {

			if ( x < 0 || x >= MAP_SIZE_X || y < 0 || y >= MAP_SIZE_Y ) {
				return undefined;
			}

			if ( this.isReversed ) {
				return this.rElements[y*MAP_SIZE_X+x];
			} else {
				return this.elements[y*MAP_SIZE_X+x];
			}
		},

		calcGemTarget: function( ) {
			var gemTarget = 0;
			this.elements.forEach(function(item) {
				gemTarget += item && item.value ? item.value : 0;
			});
			this.rElements.forEach(function(item) {
				gemTarget += item && item.value ? item.value : 0;
			});
			return gemTarget;
		},

		openDoors: function() {
			var self = this;
			var openedAnyDoor = false;
			self.elements.forEach(function(item) {
				if ( item instanceof Door && !item.isOpen ) {
					item.open();
					openedAnyDoor = true;
				}
			});
			self.rElements.forEach(function(item) {
				if ( item instanceof Door && !item.isOpen ) {
					item.open();
					openedAnyDoor = true;
				}
			});
			if ( openedAnyDoor ) {
				self.messages.push(new Message(self, STR_MSG_DOOR_OPENED, 150));
				self.audioHandler.play(AUDIO_OPENDOOR);
			}

		},

		elementToElementCode: function( element ) {
			if ( element === null ) {
				return ELEMENT_NULL;
			} else if ( element instanceof Grass ) {
				return ELEMENT_GRASS;
			} else if ( element instanceof Stone) {
				return ELEMENT_STONE;
			} else if ( element instanceof Emerald ) {
				return ELEMENT_EMERALD;
			} else if ( element instanceof Ruby ) {
				return ELEMENT_RUBY;
			} else if ( element instanceof Lava ) {
				return ELEMENT_LAVA;
			} else if ( element instanceof Wall ) {
				return ELEMENT_WALL;
			} else if ( element instanceof Bomb ) {
				return ELEMENT_BOMB;
			} else if ( element instanceof Door ) {
				return ELEMENT_DOOR;
			} else if ( element instanceof Explosion ) {
				return ELEMENT_EXPLOSION;
			} else if ( element instanceof Strider ) {
				return ENEMY_STRIDER;
			}
			return ELEMENT_NULL;
		},
		elementCodeToElement: function( elementCode, x, y ) {
			var self = this;
			var ret = null;

			switch ( elementCode ) {
				case ELEMENT_GRASS: ret = new Grass(self, x, y); break;
				case ELEMENT_STONE: ret = new Stone(self, x, y); break;
				case ELEMENT_BOMB: ret = new Bomb(self, x, y); break;
				case ELEMENT_EMERALD: ret = new Emerald(self, x, y); break;
				case ELEMENT_RUBY: ret = new Ruby(self, x, y); break;
				case ELEMENT_LAVA: ret = new Lava(self, x, y); break;
				case ELEMENT_DOOR: ret = new Door(self, x, y); break;
				case ELEMENT_WALL: ret = new Wall(self, x, y); break;
				case ELEMENT_EXPLOSION: ret = new Explosion(self, x, y); break;
				case ENEMY_STRIDER: ret = new Strider(self, x, y); break;
				case ELEMENT_NULL:
				default: ret = null; break;
			}
			return ret;
		},

		drawBackground: function() {
			var self = this;
			var i;
			self.context.fillStyle = '#000';
			self.context.fillRect(0,0, self.canvas.width, self.canvas.height);

			if ( self.state === Game.STATE_EDIT ) {

				// draw grid lines
				self.context.strokeStyle = '#555';
				// draw with offset of the player!
				for ( i = TILE_SIZE-self.renderStartX; i < self.canvas.width+self.renderStartX; i+=TILE_SIZE ) {
					self.context.beginPath();
					self.context.moveTo(i, 0);
					self.context.lineTo(i, self.canvas.height);
					self.context.stroke();
					self.context.closePath();
				}

				for ( i = TILE_SIZE-self.renderStartY; i < self.canvas.height+self.renderStartY; i+=TILE_SIZE ) {
					self.context.beginPath();
					self.context.moveTo(0, i);
					self.context.lineTo(self.canvas.width, i);
					self.context.stroke();
				}
			}
		},
		handleInput: function(){
			var self = this;

			self.inputHandler.tick();

			var i;

			/* MENU
			=========================================================================== */
			if ( self.state === Game.STATE_MENU ) {
				if ( self.inputHandler.isPressed(VK_E) ) {
					// go to edit mode
					self.startEdit();

				} else if ( self.inputHandler.isPressed(VK_SPACE) ) {
					self.start();
				} else if ( self.inputHandler.isPressed(VK_L) ) {
					// save map
					self.changeState(Game.STATE_LOADMAP);
					self.editCurrentMapName = '';
				}

			}
			/* LOAD MAP
			=========================================================================== */
			else if ( self.state === Game.STATE_LOADMAP ) {

				// get all the input until enter is pressed . this will be the name of the map.
				// or if escape is pressed, cancel savemap state and go back to edit mode

				if ( self.inputHandler.isPressed(VK_RETURN) ) {
					if ( self.editCurrentMapName.length > 0 ) {
						var map = self.loadMap(self.editCurrentMapName);
						if ( map ) {
							if ( self.prevState === Game.STATE_EDIT ) {
								self.startEdit(map);
							} else {
								self.start(map);
							}
						}
					}
				}

				for ( i = 48; i <= 90; i++ ) {
					if ( self.inputHandler.isPressed(i) ) {
						self.editCurrentMapName+=String.fromCharCode(i);
					}
				}
				if ( self.inputHandler.isPressed(VK_BACKSPACE) ) {
					if ( self.editCurrentMapName.length > 0 ) {
						self.editCurrentMapName = self.editCurrentMapName.substring(0, self.editCurrentMapName.length-1);
					}
					if ( !self.editCurrentMapName ) {
						self.editCurrentMapName = '';
					}
				}

				if ( self.inputHandler.isPressed(VK_ESCAPE) ) {
					// go back to edit mode or go back to menu
					if ( self.prevState === Game.STATE_EDIT ) {
						self.changeState(Game.STATE_EDIT);
					} else {
						self.changeState(Game.STATE_MENU);
					}
				}


			}
			/* LOAD MAP
			=========================================================================== */
			else if ( self.state === Game.STATE_SAVEMAP ) {

				// get all the input until enter is pressed . this will be the name of the map.
				// or if escape is pressed, cancel savemap state and go back to edit mode

				if ( self.inputHandler.isPressed(VK_RETURN) ) {
					if ( self.editCurrentMapName.length > 0 ) {
						if ( self.saveMap(self.editCurrentMapName) ) {
							// saved..
							// just go to edit mode
							self.changeState(Game.STATE_EDIT);
							self.messages.push(new Message(self, STR_SAVED_AS_SPACE+'"'+self.editCurrentMapName+'"...', 150));
						} else {
							self.loadSaveMapHint = STR_ERROR_UNABLE_TO_SAVE_MAP;
						}
					}
				}

				for ( i = 48; i <= 90; i++ ) {
					if ( self.inputHandler.isPressed(i) ) {
						self.editCurrentMapName+=String.fromCharCode(i);
						self.loadSaveMapHint = false;
					}
				}
				if ( self.inputHandler.isPressed(VK_BACKSPACE) ) {
					if ( self.editCurrentMapName.length > 0 ) {
						self.editCurrentMapName = self.editCurrentMapName.substring(0, self.editCurrentMapName.length-1);
					}
					if ( self.editCurrentMapName.length === 0 ) {
						self.loadSaveMapHint = STR_HINT_PLEASE_ENTER_NAME;
					}
				}

				if ( self.inputHandler.isPressed(VK_ESCAPE) ) {
					// just go to edit mode
					self.changeState(Game.STATE_EDIT);
				}


			}
			/* EDIT MAP
			=========================================================================== */
			else if ( self.state === Game.STATE_EDIT ) {


				if ( self.inputHandler.isPressed(VK_O) ) {
					/// fill the whole map with the current element type

					self.elements = [];
					self.rElements = [];
					for ( i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
						self.elements.push(null);
						self.rElements.push(null);
						self.setElementAtIndexByCode(i, self.allEditElements[self.editCurrentElement], 1);
					}

				}

				if ( self.inputHandler.isPressed(VK_P) ) {
					/// fill the whole map with the current element type

					self.elements = [];
					self.rElements = [];
					for ( i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
						self.elements.push(null);
						self.rElements.push(null);
						self.setElementAtIndexByCode(i, ELEMENT_NULL, 1);
					}
				}

				if ( self.inputHandler.isPressed(VK_SPACE) ) {
					self.editCurrentElement = self.editCurrentElement === self.allEditElements.length-1
						? 0
						: self.editCurrentElement+1;
				}

				if ( self.inputHandler.isPressed(VK_T) ) {
					if ( self.editAwaitingGemTarget !== false ) {
						self.editAwaitingGemTarget = false;
						self.gemTarget = self.calcGemTarget();
					} else {
						// awaiting target gem number
						self.editAwaitingGemTarget = '';
						self.gemTarget = 0;
					}
				}
				if ( self.editAwaitingGemTarget !== false ) {
					for ( i = 48; i < 58; i++ ) {
						// input numbers
						if ( self.inputHandler.isPressed(i) ) {
							self.editAwaitingGemTarget+=''+String.fromCharCode(i);
							self.gemTarget = Number(self.editAwaitingGemTarget);
						}
					}
					if ( self.inputHandler.isPressed(VK_RETURN) ) {
						self.editAwaitingGemTarget = false;
					}
				}

				if ( self.inputHandler.isDown(VK_E) ) {
					var pos = self.player.getActualPosition();
					self.setElementAtIndexByCode(pos.y*MAP_SIZE_X+pos.x, self.allEditElements[self.editCurrentElement], 1);
				}

				if ( self.inputHandler.isDown(VK_X) ) {
					var pos = self.player.getActualPosition();
					self.setElementAtIndex(pos.y*MAP_SIZE_X+pos.x, null, 1);
				}

				if ( self.inputHandler.isPressed(VK_L) ) {
					// load map
					//self.editCurrentMapName = '';
					self.changeState(Game.STATE_LOADMAP);
				}
				if ( self.inputHandler.isPressed(VK_S) ) {
					// save map
					//self.editCurrentMapName = '';
					self.changeState(Game.STATE_SAVEMAP);
				}

				if ( self.player.substep === 0 ) {

					if ( self.inputHandler.isDown(VK_UP) ) {
						self.player.dirX = 0;
						self.player.dirY = -1;
					} else if ( self.inputHandler.isDown(VK_DOWN) ) {
						self.player.dirX = 0;
						self.player.dirY = 1;
					} else if ( self.inputHandler.isDown(VK_LEFT) ) {
						self.player.dirX = -1;
						self.player.dirY = 0;
					} else if ( self.inputHandler.isDown(VK_RIGHT) ) {
						self.player.dirX = 1;
						self.player.dirY = 0;
					} else {
						self.player.dirX = 0;
						self.player.dirY = 0;
					}

					if ( self.inputHandler.isPressed(VK_R) ) {
						self.isReversed = !self.isReversed;
						self.audioHandler.play(AUDIO_REVERSE);
					}
				}

				if ( self.inputHandler.isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
					self.changeState(Game.STATE_MENU);
				}

			}
			/* GAME
			=========================================================================== */
			else if ( self.state === Game.STATE_GAME && self.player.substep === 0 ) {

				if ( self.inputHandler.isDown(VK_UP) ) {
					self.player.dirX = 0;
					self.player.dirY = -1;
				} else if ( self.inputHandler.isDown(VK_DOWN) ) {
					self.player.dirX = 0;
					self.player.dirY = 1;
				} else if ( self.inputHandler.isDown(VK_LEFT) ) {
					self.player.dirX = -1;
					self.player.dirY = 0;
				} else if ( self.inputHandler.isDown(VK_RIGHT) ) {
					self.player.dirX = 1;
					self.player.dirY = 0;
				} else {
					self.player.dirX = 0;
					self.player.dirY = 0;
				}

				if ( self.inputHandler.isPressed(VK_R) ) {
					self.isReversed = !self.isReversed;
					self.audioHandler.play(AUDIO_REVERSE);
				}

				if ( self.inputHandler.isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
					self.changeState(Game.STATE_MENU);
				}

			}
			/* OTHER STATES
			=========================================================================== */
			else {


				if ( self.inputHandler.isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
					self.changeState(Game.STATE_MENU);
				}

			}

			if ( self.inputHandler.isPressed(VK_M) ) {
				self.isMuted = !self.isMuted;
				self.audioHandler.mute(self.isMuted);
			}

		},

		maybeCreateExplosion: function(x, y) {

			var self = this;

			// check if we hit a bomb, if yes, explode them too

			var el = self.getElementAtPos(x,y);

			if ( typeof el === UNDEF ) {
				return;
			}
			if ( el instanceof Wall ) {
				return;
			}

			var chkEl = el instanceof Dummy ? el.ref : el;

			// if there is already an explosion, continue
			if ( chkEl instanceof Explosion ) {
				return;
			}


			// if there is a bomb, then create an explosion at the position where the thing will be falling to
			if ( chkEl instanceof Bomb ) {
				self.createExplosion(x, y);
			} else if ( chkEl !== null ) {
				// delete original element
				var pos = chkEl.getActualPosition();
				self.deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
			}

			// add explosion entity at the place
			self.setElementAtIndexByCode(y*MAP_SIZE_X+x, ELEMENT_EXPLOSION);

		},

		// the x and y given to this function are coordinates, not real x y positions
		createExplosion: function(px, py) {

			var self = this;

			// set desired place to explosion
			self.setElementAtIndexByCode(py*MAP_SIZE_X+px, ELEMENT_EXPLOSION);


			// set surrounding places to explosions (maybe)
			self.maybeCreateExplosion(px-1, py-1);
			self.maybeCreateExplosion(px, py-1);
			self.maybeCreateExplosion(px+1, py-1);

			self.maybeCreateExplosion(px-1, py);
			self.maybeCreateExplosion(px+1, py);

			self.maybeCreateExplosion(px-1, py+1);
			self.maybeCreateExplosion(px, py+1);
			self.maybeCreateExplosion(px+1, py+1);

			self.audioHandler.play(AUDIO_EXPLOSION);
		},


		anyMobileEntityAt: function(playerPosBefore, x, y){
			var self = this;
			var anyMobileEntityAt = playerPosBefore.x === x && playerPosBefore.y === y;
			if ( !anyMobileEntityAt ) {
				self.enemies.forEach(function(enemy) {
					var p = enemy.getActualPosition();
					anyMobileEntityAt = anyMobileEntityAt || p.x === x && p.y === y;
				});
			}
			return anyMobileEntityAt;
		},

		update: function() {
			var self = this;


			var currentTime = new Date().getTime();
			if ( currentTime - self.lastUpdate <= 1000/60 ) {
				return;
			}

			self.lastUpdate = currentTime;

			// update all elements ( they might start or stop falling )
			var playerPosBefore = self.player.getActualPosition();


			if ( self.state === Game.STATE_GAME ) {
				if ( self.player.substep === 0 ) {
					// when player is on the door, he won the game! :p
					var elAtPlayerPos = self.getElementAtPos(playerPosBefore.x, playerPosBefore.y);
					if ( elAtPlayerPos instanceof Door && elAtPlayerPos.isOpen ) {
						// won
						self.changeState(Game.STATE_WON);
						self.player.dirX = 0;
						self.player.dirY = 0;
						self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
						return;
					}
				}
			}



			// first move the player
			var playerHasMoved = false;

			// check if at the position is something and that something is not already moving
			if ( self.player.dirX !== 0 || self.player.dirY !== 0 ) {
				self.player.move();
				playerHasMoved = true;

				// player moves each field in 8 steps
				self.player.substep = self.player.substep < self.player.stepsPerTile-1 ? self.player.substep+1 : 0;
			}

			// then move the enemies and elements

			if ( self.state === Game.STATE_GAME ) {

				// move enemies
				self.enemies.forEach(function(enemy) {
					enemy.update();
				});


				var elementsToUpdate = self.isReversed ? self.rElements : self.elements;
				elementsToUpdate.forEach(function(item, idx) {
					if ( item === null ) {
						return;
					}

					if ( item instanceof Explosion && --item.ticktick === 0 ) {
						self.deleteElementAtIndex(idx);
						return;
					}

					var pos = item.getActualPosition();

					if ( (item instanceof Stone || item instanceof Bomb) && item.substep === 0 ) {
						// get element below the stone:
						var elBelow = self.getElementAtPos(pos.x, pos.y+1);

						if ( elBelow === null && (item.wasFalling || !self.anyMobileEntityAt(playerPosBefore, pos.x, pos.y+1)) ) {
							// let the stone fall down
							item.dirY = 1;
							item.dirX = 0;
							item.isFalling = true;
							item.wasFalling = false;
							if ( ! item instanceof Bomb || ! item.wasFalling ) {
								self.setElementAtIndex(pos.y*MAP_SIZE_X + MAP_SIZE_X + pos.x, new Dummy(item)); // item will fall there eventually!
							}

						} else if ( (elBelow instanceof Stone || elBelow instanceof Bomb) && !item.isFalling ) {

							var elLeft = self.getElementAtPos(pos.x-1, pos.y);
							var elLeftBelow = self.getElementAtPos(pos.x-1, pos.y+1);
							if ( elLeft === null
								&& elLeftBelow === null
								&& !(self.anyMobileEntityAt(playerPosBefore, pos.x-1, pos.y))
								&& !(self.anyMobileEntityAt(playerPosBefore, pos.x-1, pos.y+1))
								) {
								item.dirX = -1;
								item.dirY = 0;
								item.isFalling = true;
								if ( ! item instanceof Bomb || ! item.wasFalling ) {
									self.setElementAtIndex(pos.y*MAP_SIZE_X + pos.x-1, new Dummy(item)); // item will fall there eventually!
								}
							} else {
								var elRight =  self.getElementAtPos(pos.x+1, pos.y);
								var elRightBelow = self.getElementAtPos(pos.x+1, pos.y+1);
								if ( elRight === null
									&& elRightBelow === null
									&& !(self.anyMobileEntityAt(playerPosBefore, pos.x+1, pos.y))
									&& !(self.anyMobileEntityAt(playerPosBefore, pos.x+1, pos.y+1))
									) {
									item.dirX = 1;
									item.dirY = 0;
									item.isFalling = true;

									if ( ! item instanceof Bomb || ! item.wasFalling ) {
										self.setElementAtIndex(pos.y*MAP_SIZE_X + pos.x+1, new Dummy(item)); // item will fall there eventually!
									}
								}
							}

						}
					}

					if ( item instanceof Bomb && item.wasFalling ) {
						self.createExplosion(pos.x,pos.y);
					}
					if (item.wasFalling) {
						item.wasFalling = false;

						if ( item instanceof Stone ) {
							self.audioHandler.play(AUDIO_STONE);
						}
					}
				});

				elementsToUpdate.forEach(function(item, idx) {
					if ( item === null ) {
						return;
					}

					if ( item.dirX === 0 && item.dirY === 0 ) {
						return;
					}

					item.move();
					item.substep = item.substep < item.stepsPerTile-1 ? item.substep+1 : 0;



					// when the thing is falling and collided with the player, let the player die!
					if ( item.isFalling && item.x <= self.player.x && self.overlaps(item, self.player) ) {
						self.changeState(Game.STATE_GAMEOVER);
						self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
						self.audioHandler.play(AUDIO_DEATH);
						//self.audioHandler.playSequence('deathsong');
						return;
					}

					// when the thing is falling and collided with an enemy, let the enemy die!
					if ( item.isFalling ) {
						self.enemies.forEach(function(enemy, idx, arr) {
							if ( item.x <= enemy.x && self.overlaps(item, enemy) ) {
								arr.splice(idx,1);

								var p = enemy.getActualPosition();
								if ( item instanceof Bomb ) {
									self.createExplosion(p.x, p.y);
								} else {
									// create explosion only at this one field
									self.maybeCreateExplosion(p.x, p.y);
								}

							}
						});
					}


					if ( item.substep > 0 ) {
						return;
					}

					item.dirX = 0;
					item.dirY = 0;

					// stop falling
					if ( (item instanceof Stone || item instanceof Bomb) && item.isFalling ) {
						item.isFalling = false;
						item.wasFalling = true;
					}

					var pos = item.getActualPosition();

					self.deleteElementAtIndex(idx);
					self.setElementAtIndex(pos.y*MAP_SIZE_X+pos.x, item);

				});
			}

			var unmove = false;
			if ( self.player.substep === 1 ) {

				// player started moving. lets see if he hits the bounds of the map, if yes, then unmove and set substep to 0;
				if ( ( self.player.x <= 0 && self.player.dirX < 0 )
					|| ( self.player.x >= MAP_SIZE_X*TILE_SIZE-TILE_SIZE && self.player.dirX > 0 )
					|| ( self.player.y <= 0 && self.player.dirY < 0 )
					|| ( self.player.y >= MAP_SIZE_Y*TILE_SIZE-TILE_SIZE && self.player.dirY > 0 )
					) {
					unmove = true;
				} else if ( self.player.dirX !== 0 ) {

					if ( self.state === Game.STATE_GAME ) {
						// check left right elements if player can move there
						// moving horizontally
						var nextEl= self.getElementAtPos(playerPosBefore.x+self.player.dirX, playerPosBefore.y);
						var nextNextEl = self.getElementAtPos(playerPosBefore.x+self.player.dirX+self.player.dirX, playerPosBefore.y);

						// do we have to unmove the player?
						if ( typeof nextEl === UNDEF ) {
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
					}
				} else if ( self.player.dirY !== 0 ) {
					if ( self.state === Game.STATE_GAME ) {
						// check top/bottom elements
						// moving vertically

						var nextEl= self.getElementAtPos(playerPosBefore.x, playerPosBefore.y+self.player.dirY);
						//var nextNextEl = self.elements[(playerPosBefore.y+self.player.dirY+self.player.dirY)*MAP_SIZE_X+playerPosBefore.x];

						// do we have to unmove the player?
						if ( typeof nextEl === UNDEF ) {
							unmove = true;
						} else if ( nextEl === null || nextEl.isWalkable ) {
							// ok
						} else {
							unmove = true;
						}
					}
				}

			}

			if ( unmove ) {
				// just dont move..
				self.player.unmove();
				self.player.substep = 0;
				playerHasMoved = false;
			}


			if ( playerHasMoved && self.player.substep === 0 ) {
				self.audioHandler.play(AUDIO_WALK);
			}

			if ( self.state === Game.STATE_GAME ) {
				// player pos to index:

				self.enemies.forEach(function(enemy, idx, arr) {
					if ( self.overlaps(enemy, self.player) ) {
						// die!!!! :3
						self.changeState(Game.STATE_GAMEOVER);
						self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
						self.audioHandler.play(AUDIO_DEATH);
					}


					var p = enemy.getActualPosition();
					var elAtEntity= self.getElementAtPos(p.x, p.y);
					if ( elAtEntity === null ) {
					} else if ( elAtEntity.isDeadly ) {
						arr.splice(idx,1);
					}
				});


				var playerPosAfter = self.player.getActualPosition();
				var elIndex = playerPosAfter.y*MAP_SIZE_X+playerPosAfter.x;
				var elAtPlayer= self.getElementAtPos(playerPosAfter.x, playerPosAfter.y);
				if ( elAtPlayer === null ) {
				} else if ( elAtPlayer.isDeadly ) {

					// die!!!! :3
					self.changeState(Game.STATE_GAMEOVER);
					self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
					self.audioHandler.play(AUDIO_DEATH);

				} else if ( elAtPlayer instanceof Grass ) {

					self.deleteElementAtIndex(elIndex);

				} else if ( elAtPlayer instanceof Gem ) {

					self.player.gemCount+= elAtPlayer.value;
					self.deleteElementAtIndex(elIndex);
					if ( self.player.gemCount >= self.gemTarget ) {
						// open all doors
						self.openDoors();
					}
					elAtPlayer.playCollectSound();

				}
			}


		},

		overlaps: function( item1, item2, threshold ) {
			// check if overlap with a threshold
			threshold = threshold || TILE_SIZE/8; //default threshold quarter of a tile (/8 because it counts twice)
			return (
				item1.x+threshold < item2.x+item2.w-threshold
				&& item1.x+item1.w-threshold > item2.x+threshold
				&& item1.y+threshold < item2.y+item2.h-threshold
				&& item1.y+item1.h-threshold > item2.y+threshold
			);
		},
		drawEnemies: function() {
			var self = this;
			self.enemies.forEach(function(enemy) {
				enemy.render(self.context);
			});
			//self.player.render(self.context);
		},
		drawElements: function() {
			var self=  this;

			self.renderStartX = self.player.x - VISIBLE_WIDTH*HALF_TILE_SIZE;
			self.renderStartY = self.player.y - VISIBLE_HEIGHT*HALF_TILE_SIZE;
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

			var elementsToRender = self.isReversed ? self.rElements : self.elements;
			elementsToRender.forEach(function(item) {
				if ( item === null
					|| item.x < self.renderStartX-TILE_SIZE
					|| item.x > self.renderStartX+VISIBLE_WIDTH*TILE_SIZE + TILE_SIZE
					|| item.y < self.renderStartY-TILE_SIZE
					|| item.y > self.renderStartY+VISIBLE_HEIGHT*TILE_SIZE + TILE_SIZE
					|| !item.gfx
					) {
					return;
				}

				item.render(self.context);

			});

			//this.font.renderText(context, 'hallo\n\nabcdefghi  jklmnopqrstuvwxyz', 50,50);
		},

		drawHud: function() {
			var self = this;


			var hudRightElement = new Gfx(self.sprite, 48, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			var hudLeftElement = new Gfx(self.sprite, 48, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			var hudCenterElement = new Gfx(self.sprite, 48, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);

			for ( var i = 1; i < VISIBLE_WIDTH-1; i++ ) {
				hudCenterElement.render(self.context, i*TILE_SIZE, VISIBLE_HEIGHT*TILE_SIZE);
			}
			hudLeftElement.render(self.context, 0, VISIBLE_HEIGHT*TILE_SIZE);
			hudRightElement.render(self.context, VISIBLE_WIDTH*TILE_SIZE-TILE_SIZE, VISIBLE_HEIGHT*TILE_SIZE);

			var timeNow = new Date().getTime();
			var timeElapsed = (0.5+(timeNow - self.startTime)/1000) | 0;
			var statusText = '';
			if ( self.state === Game.STATE_GAMEOVER ) {
				statusText = STR_STATUS_TEXT_GAMEOVER;
			} else if ( self.state === Game.STATE_WON ) {
				statusText = STR_STATUS_TEXT_WIN;
			} else if ( self.state === Game.STATE_GAME ) {
				statusText = STR_GEMS_COLON+ self.player.gemCount + '/' + self.gemTarget;
			} else if ( self.state === Game.STATE_EDIT ) {
				statusText = STR_GEM_TARGET_COLON+self.gemTarget;
			}


			if ( self.state === Game.STATE_EDIT ) {
				var x = statusText.length*FONT_SIZE+FONT_SIZE+HALF_FONT_SIZE,
					y = VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE;



				self.font.renderText(
					self.context,
					STR_EDIT_HELP_1,
					HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE-FONT_SIZE-HALF_FONT_SIZE,
					16 // smaller font
				);
				self.font.renderText(
					self.context,
					STR_EDIT_HELP_2,
					HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE-FONT_SIZE-HALF_FONT_SIZE+24,
					16 // smaller font
				);


				self.allEditElements.forEach(function(e, i) {

					if ( self.editCurrentElement === i ) {
						self.context.fillStyle = '#f00';
						self.context.fillRect(x-2,y-2, FONT_SIZE+4, FONT_SIZE+4);
					}

					if ( self.elementGraphics[e] ) {
						self.elementGraphics[e].render(self.context,x,y,undefined,undefined,FONT_SIZE);
					}
					x+= FONT_SIZE+HALF_FONT_SIZE;

				});

			}

			self.font.renderText(
				self.context,
				statusText,
				HALF_FONT_SIZE,
				VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE
			);

			if ( self.state === Game.STATE_GAME || self.state === Game.STATE_GAMEOVER || self.state === Game.STATE_WON ) {

				var s = timeElapsed%60;
				var timeText = (timeElapsed/60 | 0)+':'+(s > 9 ? s : '0'+s);
				self.font.renderText(
					self.context,
					timeText,
					VISIBLE_WIDTH*TILE_SIZE - timeText.length * FONT_SIZE - HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE
				);
			}

			var msgOffset = 0;
			self.messages.forEach(function(msg, idx, arr) {
				if ( --msg.ticktick === 0 ) {
					arr.splice(idx,1);
				}
				msg.render(self.context, msgOffset++);
			});


		},

		drawMenu: function() {
			var self = this;
			var y = 50;
			self.font.renderText(self.context, STR_MENU_START_RANDOM_GAME, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font.renderText(self.context, STR_MENU_LOAD_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font.renderText(self.context, STR_MENU_EDIT_MAP, 50, y);
		},

		drawSave: function() {
			var self = this;
			var y = 50;
			self.font.renderText(self.context, STR_SAVE_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font.renderText(self.context, STR_NAME_COLON+self.editCurrentMapName, 50, y);
			if ( self.loadSaveMapHint ) {
				y+=FONT_SIZE+HALF_FONT_SIZE;
				y+=FONT_SIZE+HALF_FONT_SIZE;
				self.font.renderText(self.context, STR_HINT_COLON+self.loadSaveMapHint, 50, y);
			}
		},
		drawLoad: function() {
			var self = this;
			var y = 50;
			self.font.renderText(self.context, STR_LOAD_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font.renderText(self.context, STR_NAME_COLON+self.editCurrentMapName, 50, y);
			if ( self.loadSaveMapHint ) {
				y+=FONT_SIZE+HALF_FONT_SIZE;
				y+=FONT_SIZE+HALF_FONT_SIZE;
				self.font.renderText(self.context, STR_HINT_COLON+self.loadSaveMapHint, 50, y);
			}
		},

		render: function() {
			var self = this;
			self.drawBackground();
			if ( self.state === Game.STATE_MENU ) {
				self.drawMenu();
			} else if ( self.state === Game.STATE_LOADMAP ) {
				self.drawLoad();
			} else if ( self.state === Game.STATE_SAVEMAP ) {
				self.drawSave();
			} else {
				// render everything
				self.drawElements();
				self.drawEnemies();
				self.drawHud();
				self.player.render(self.context);
			}
		},

		start: function( mapObj ) {
			var self = this;

			self.startTime = new Date().getTime();

			self.messages = [];
			//self.messages.push(new Message(this, 'Welcome..', 300));
			//self.messages.push(new Message(this, '...to the jungle..', 300));

			self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
			self.audioHandler.playSequence(AUDIO_BG_MUSIC);

			if ( mapObj ) {
				self.readMap(mapObj);
			} else {
				self.randomMap();
			}
			self.changeState(Game.STATE_GAME);
		},

		startEdit: function( map ) {
			var self = this;
			self.startTime = new Date().getTime();

			self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
			self.audioHandler.playSequence(AUDIO_BG_MUSIC);

			if ( map ) {
				self.readMap(map);
			} else {
				self.elements = [];
				self.rElements = [];
				self.enemies = [];
				self.gemCount = 0;
				self.gemTarget = 0;
				for ( var i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
					self.elements.push(null);
					self.rElements.push(null);
				}
				self.player = new Player(self, 0, 0);
			}


			self.editCurrentElement = 0;
			self.changeState(Game.STATE_EDIT);

		},
		reset: function() {

		}
	};


	window.addEventListener('load', function() {
		new Game();
	});

})();