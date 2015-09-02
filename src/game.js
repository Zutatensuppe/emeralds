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
	// Numeric representation of the Elements
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
	var ENEMY_NIKI = 11;


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

	var WndAddEventListener = window.addEventListener;
	var ObjCreate = Object.create;

	/////////////////////////////////////////////////////////////////
	// Sprite/Graphics
	/////////////////////////////////////////////////////////////////

	function Sprite( file, cb ) {
		// init the sprite image
		this._image = new Image();
		this._image.onload = cb;
		this._image.src = file;
	}
	Sprite[PROTO] = {
		_render: function(screen, sX, sY, sW, sH, dX, dY, dW, dH) {
			screen.drawImage(this._image, sX, sY, sW, sH, dX, dY, dW, dH );
		}
	};

	function Gfx( sprite, x, y, w, h ) {
		this._sprite = sprite;
		this._x = x;
		this._y = y;
		this._w = w;
		this._h = h;
	}
	Gfx[PROTO] = {
		_render: function(screen, destX, destY, shiftX, shiftY, TS) {
			var self = this;
			TS = TS || TILE_SIZE;
			if ( !shiftX && !shiftY ) {
				self._sprite._render(screen, self._x, self._y, self._w, self._h, destX, destY, TS, TS);
				return;
			}
			// wrap the sprite image

			shiftX = shiftX || 0;
			shiftY = shiftY || 0;

			var ratioX = TS / self._w;
			var ratioY = TS / self._h;

			var w1, w2, h1, h2;
			if ( shiftX ) {
				w2 = Math.abs(shiftX);
				w1 = self._w - w2;
			} else {
				w2 = self._w;
				w1 = self._w;
			}
			if ( shiftY ) {
				h2 = Math.abs(shiftY);
				h1 = self._h - h2;
			} else {
				h2 = self._h;
				h1 = self._h;
			}

			// render part 1
			self._sprite._render(
				screen,
				self._x + shiftX,
				self._y + shiftY,
				w1,
				h1,
				destX,
				destY,
				w1*ratioX,
				h1*ratioY
			);

			// render part 2
			self._sprite._render(
				screen,
				self._x,
				self._y,
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
		this._letters = ''+
			'abcdefg'+
			'hijklmn'+
			'opqrstu'+
			'vwxyz?!'+
			':,.1234'+
			'567890/'+
			'+"';
		this._sprite = sprite;
		// left upper corner of "letter" block in sprite
		this._x = 64;
		this._y = 0;

	}
	Font[PROTO] = {
		_renderText: function(screen, text, x, y, FS) {
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

				var letterIdx = self._letters.indexOf(chr);
				if ( letterIdx >= 0 ) {
					// found the letter
					self._sprite._render(
						screen,
						// 7 letters per col
						self._x + ((letterIdx/7) | 0)*8,
						self._y + (letterIdx%7)*8,
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
		self._isPressed = false;
		self._isDown = false;
		self._presses = 0;
		self._absorbs = 0;
	}
	VirtualKey[PROTO] = {
		_toggle: function(pressed) {
			var self = this;
			if ( pressed !== self._isDown ) {
				self._isDown = pressed;
			}
			if ( pressed ) {
				self._presses++;
			}
		},
		_tick: function() {
			var self = this;
			if ( self._absorbs < self._presses ) {
				self._absorbs++;
				self._isPressed = true;
			} else {
				self._isPressed = false;
			}
		},
		_reset: function() {
			var self = this;
			self._isPressed = false;
			self._isDown = false;
			self._presses = 0;
			self._absorbs = 0;
		}
	};

	function InputHandler() {
		var self = this;

		self._vk = {};

		WndAddEventListener('keydown', function(e) {
			self._toggle(e, true);
		});
		WndAddEventListener('keyup', function(e) {
			self._toggle(e, false);
		});
	}
	InputHandler[PROTO] = {
		_toggle: function(e, pressed) {
			var keyCode = e.keyCode;
			var self = this;
			// 0-9 and a-z
			if ( !self._vk[keyCode] && (
				(keyCode >= 48 && keyCode <= 90) ||
				keyCode === VK_LEFT ||
				keyCode === VK_RIGHT ||
				keyCode === VK_UP ||
				keyCode === VK_DOWN ||
				keyCode === VK_SPACE ||
				keyCode === VK_RETURN ||
				keyCode === VK_ESCAPE ||
				keyCode === VK_BACKSPACE) ) {
				self._vk[keyCode] = new VirtualKey();
			}
			if ( self._vk[keyCode] ) {
				self._vk[keyCode]._toggle(pressed);
				e.preventDefault();
			}
		},
		_tick: function() {
			Object.keys(this._vk).forEach(function(i) {
				this._vk[i]._tick();
			}, this);
		},
		_isDown: function(keyCode) {
			return this._vk[keyCode] && this._vk[keyCode]._isDown;
		},
		_isPressed: function(keyCode) {
			return this._vk[keyCode] && this._vk[keyCode]._isPressed;
		},
		_reset: function() {
			Object.keys(this._vk).forEach(function(i) {
				this._vk[i]._reset();
			}, this);
		}
	};


	/////////////////////////////////////////////////////////////////
	// Audio
	/////////////////////////////////////////////////////////////////
	function AudioHandler() {
		this._sounds = {};
		this._sequences = {};
		this._isMuted = false;
	}
	AudioHandler[PROTO] = {

		mute: function( mute ) {
			var self = this;
			self._isMuted = mute;
			Object.keys(self._sequences).forEach(function(i) {
				self._sequences[i].mute(mute);
			});
		},

		_hasSequence: function(key) {
			return !!this._sequences[key];
		},

		_addSequence: function(key, sequencer) {
			this._sequences[key] = sequencer;
		},
		_playSequence: function(key) {
			if ( ! this._sequences[key] ) {
				return;
			}
			this._sequences[key].play();
		},
		_stopSequence: function(key) {
			if ( ! this._sequences[key] ) {
				return;
			}
			this._sequences[key].stop();
		},

		has: function(key) {
			return !!this._sounds[key];
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
			self._sounds[key] = [];

			// foreach sound setting we have given for the key, push an entry
			soundSettings.forEach(function(item, idx) {
				self._sounds[key].push({
					current: 0,
					count: simultanousCount,
					pool: []
				});
				// push as many entries as we want
				for ( var i = 0; i < simultanousCount; i++ ) {
					var audio = new Audio();
					audio.src = jsfxr(item);
					self._sounds[key][idx].pool.push(audio);

					//this.sounds[key][idx].pool.push(item);
				}
			});
		},
		play: function(key) {
			// fetch the sound for the key
			var sound = this._sounds[key];
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
			if ( !this._isMuted ) {
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
		self._game = g;
		self._gfx = gfx;
		self._x = x;
		self._y = y;
		self._w = w;
		self._h = h;
		self._dirX = 0;
		self._dirY = 0;
		self._speed = 0;
		self._stepsPerTile = 1;
		self._substep = 0;
		self._isWalkable = false;
		self._isPushable = false;
		self._isSlippery = false;
		self._isDeadly = false;
		self._canFall = false;
		self._isFalling = false;
		self._wasFalling = false;
		self._ticks = 0;
	}
	Entity[PROTO]._getActualPosition = function() {
		return {
			x: (this._x/TILE_SIZE + 0.5) | 0,
			y: (this._y/TILE_SIZE + 0.5) | 0
		};
	};
	Entity[PROTO]._move = function() {
		var self = this;
		self._x = self._x+self._dirX*self._speed;
		self._y = self._y+self._dirY*self._speed;
	};
	Entity[PROTO]._render = function(context) {
		var self = this;
		self._gfx._render(context, self._x - self._game._renderStartX, self._y - self._game._renderStartY);
	};
	Entity[PROTO].update = function( idx ) {
		var self = this;

		if ( self._game._state !== Game._STATE_GAME || self._game._ticks <= self._ticks ) {
			return;
		}

		self._ticks = self._game._ticks;

		var pos = self._getActualPosition();

		if ( self._canFall && self._substep === 0 ) {
			// get element below the stone:
			var elBelow = self._game._getElementAtPos(pos.x, pos.y+1);

			if ( elBelow === null && (self._wasFalling || !self._game._anyMobileEntityAt(pos.x, pos.y+1)) ) {
				// let the stone fall down
				self._dirY = 1;
				self._dirX = 0;
				self._isFalling = true;
				self._wasFalling = false;
				if ( ! self instanceof Bomb || ! self._wasFalling ) {
					self._game._setElementAtIndex(pos.y*MAP_SIZE_X + MAP_SIZE_X + pos.x, new Dummy(self)); // item will fall there eventually!
				}

			} else if ( typeof elBelow !== UNDEF && elBelow !== null && elBelow._isSlippery && !self._isFalling ) {

				var elLeft = self._game._getElementAtPos(pos.x-1, pos.y);
				var elLeftBelow = self._game._getElementAtPos(pos.x-1, pos.y+1);
				if ( elLeft === null
					&& elLeftBelow === null
					&& !(self._game._anyMobileEntityAt(pos.x-1, pos.y))
					&& !(self._game._anyMobileEntityAt(pos.x-1, pos.y+1))
					) {
					self._dirX = -1;
					self._dirY = 0;
					self._isFalling = true;
					if ( ! self instanceof Bomb || ! self._wasFalling ) {
						self._game._setElementAtIndex(pos.y*MAP_SIZE_X + pos.x-1, new Dummy(self)); // item will fall there eventually!
					}
				} else {
					var elRight =  self._game._getElementAtPos(pos.x+1, pos.y);
					var elRightBelow = self._game._getElementAtPos(pos.x+1, pos.y+1);
					if ( elRight === null
						&& elRightBelow === null
						&& !(self._game._anyMobileEntityAt(pos.x+1, pos.y))
						&& !(self._game._anyMobileEntityAt(pos.x+1, pos.y+1))
						) {
						self._dirX = 1;
						self._dirY = 0;
						self._isFalling = true;

						if ( ! self instanceof Bomb || ! self._wasFalling ) {
							self._game._setElementAtIndex(pos.y*MAP_SIZE_X + pos.x+1, new Dummy(self)); // item will fall there eventually!
						}
					}
				}

			}
		}

		if (self._wasFalling) {
			self._wasFalling = false;

			if ( self instanceof Bomb ) {
				self._game._createExplosion(pos.x,pos.y);
			}
			if ( self instanceof Stone ) {
				self._game._audioHandler.play(AUDIO_STONE);
			}
		}



		if ( self._dirX === 0 && self._dirY === 0 ) {
			return;
		}

		self._move();
		self._substep = self._substep < self._stepsPerTile-1 ? self._substep+1 : 0;

		if ( self._substep > 0 ) {
			return;
		}

		self._dirX = 0;
		self._dirY = 0;

		// stop falling
		if ( self._canFall && self._isFalling ) {
			self._isFalling = false;
			self._wasFalling = true;
		}

		pos = self._getActualPosition();

		self._game._deleteElementAtIndex(idx);
		self._game._setElementAtIndex(pos.y*MAP_SIZE_X+pos.x, self);

	};


	/* The Player
	===============================================================*/
	function Player(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, null, x, y, TILE_SIZE, TILE_SIZE);
		self._speed = OBJECT_SPEED;
		self._stepsPerTile = TILE_SIZE/self._speed;
		self._substep = 0; // max TILE_SIZE/this.speed
		self._gemCount = 0;

		self._gfx = new Gfx(g._sprite, 16, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		self._gfxRight = [new Gfx(g._sprite, 32, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g._sprite, 16, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self._gfxLeft = [new Gfx(g._sprite, 0, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g._sprite, 0, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self._gfxDown = [new Gfx(g._sprite, 16, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g._sprite, 16, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		self._gfxUp = [new Gfx(g._sprite, 0, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g._sprite, 16, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
	}
	Player[PROTO] = Object.create(Entity[PROTO]);
	Player[PROTO][CONSTRUCTOR] = Player;
	Player[PROTO]._render = function(context) {

		var self = this;
		var screenX = self._x - self._game._renderStartX;
		var screenY = self._y - self._game._renderStartY;

		if (  self._game._state === Game._STATE_GAME || self._game._state === Game._STATE_EDIT ) {
			var frame = self._game._ticks % 24 < 12 ? 1 : 0;
			if ( self._dirX < 0 ) {
				self._gfxLeft[frame]._render(context, screenX, screenY);
			} else if ( self._dirX > 0 ) {
				self._gfxRight[frame]._render(context, screenX, screenY);
			} else if ( self._dirY > 0 ) {
				self._gfxDown[frame]._render(context, screenX, screenY);
			} else if ( self._dirY < 0 ) {
				self._gfxUp[frame]._render(context, screenX, screenY);
			} else {
				self._gfx._render(context, screenX, screenY);
			}
		} else {
			self._gfx._render(context, screenX, screenY);
		}
	};

	/* Enemy
	===============================================================*/
	function Enemy(g, gfx, x, y, w, h) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, gfx, x, y, w, h);
		self._isDeadly = true;
		self._ticktick = 0;
	}
	Enemy[PROTO] = ObjCreate(Entity[PROTO]);
	Enemy[PROTO][CONSTRUCTOR] = Enemy;
	Enemy[PROTO]._render = function(context) {
		var self = this;
		var screenX = self._x - self._game._renderStartX;
		var screenY = self._y - self._game._renderStartY;
		self._gfx._render(context, screenX, screenY);
	};
	Enemy[PROTO]._determineDirection = function() {};
	Enemy[PROTO]._canMove = function() {
		var self = this;
		var canMove = self._dirX !== 0 || self._dirY !== 0;
		if ( self._substep === 0 ) {

			var pos = self._getActualPosition();

			// enemy started moving. lets see if he hits the bounds of the map or hit an obstacle
			if ( self._x+self._dirX < 0 || self._x+self._dirX > MAP_SIZE_X*TILE_SIZE-TILE_SIZE
				|| self._y+self._dirY < 0 || self._y+self._dirY > MAP_SIZE_Y*TILE_SIZE-TILE_SIZE
				|| self._game._getElementAtPos(pos.x+self._dirX, pos.y+self._dirY) !== null
			) {
				canMove = false;
			}

		}
		return canMove;
	};
	Enemy[PROTO]._hitObstacle = function() {};
	Enemy[PROTO].update = function() {
		var self = this;

		if ( self._game._state !== Game._STATE_GAME || self._game._ticks <= self._ticks ) {
			return;
		}
		self._ticks = self._game._ticks;

		// check if this enemy must wait until next move.
		if ( self._ticktick > 0 ) {
			self._ticktick--;
			return;
		}

		self._determineDirection();

		if ( self._canMove() ) {
			self._move();
			// enemy moves each field in 8 steps
			self._substep = self._substep < self._stepsPerTile-1 ? self._substep+1 : 0;
		} else {
			// this means the unit hit some kind of obstacle or end of map..
			// stop moving and stay there for some ticks:
			self._ticktick = 10;
			self._substep = 0;
			//self.dirX = 0;
			//self.dirY = 0;
			self._hitObstacle();
		}
	};

	/* Strider
	 ===============================================================*/
	function Strider(g, x, y) {
		var self = this;
		Enemy[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ENEMY_STRIDER], x, y, TILE_SIZE, TILE_SIZE);
		self._speed = OBJECT_SPEED;
		self._stepsPerTile = TILE_SIZE/self._speed;
		self._substep = 0; // max TILE_SIZE/this._speed
	}
	Strider[PROTO] = ObjCreate(Enemy[PROTO]);
	Strider[PROTO][CONSTRUCTOR] = Strider;
	Strider[PROTO]._determineDirection = function() {
		var self = this;
		if ( self._dirX < 0 ) {
			self._dirY = 0;
		} else if ( self._dirX > 0 ) {
			self._dirY = 0;
		} else if ( self._dirY < 0 ) {
			self._dirX = 0;
		} else if ( self._dirY > 0 ) {
			self._dirX = 0;
		}

		if ( self._dirX === 0 && self._dirY === 0 ) {
			var x = Math.random();
			if ( x < 0.25 ) {
				self._dirX = 1;
			} else if ( x < 0.5 ) {
				self._dirX = -1;
			} else if ( x < 0.75 ) {
				self._dirY = 1;
			} else {
				self._dirY = -1;
			}
		}
	};
	Strider[PROTO]._hitObstacle = function() {
		var self = this;
		self._dirY = 0;
		self._dirX = 0;
	};

	/* Niki
	 ===============================================================*/
	function Niki(g, x, y) {
		var self = this;
		Enemy[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ENEMY_NIKI], x, y, TILE_SIZE, TILE_SIZE);
		self._speed = OBJECT_SPEED;
		self._stepsPerTile = TILE_SIZE/self._speed;
		self._substep = 0; // max TILE_SIZE/this._speed
		self._dir = -1;
	}
	Niki[PROTO] = ObjCreate(Enemy[PROTO]);
	Niki[PROTO][CONSTRUCTOR] = Niki;
	Niki[PROTO]._turnLeft = function() {
		var self = this;
		if ( self._dirX < 0 ) {
			self._dirX = 0;
			self._dirY = 1; // down
		} else if ( self._dirY > 0 ) {
			self._dirY = 0;
			self._dirX = 1; // right
		} else if ( self._dirX > 0) {
			self._dirX = 0;
			self._dirY = -1; // up
		} else if ( self._dirY < 0 ) {
			self._dirY = 0;
			self._dirX = -1; // left
		}
	};
	Niki[PROTO]._turnRight = function() {
		this._turnLeft();
		this._turnLeft();
		this._turnLeft();
	};
	Niki[PROTO]._determineDirection = function() {

		// check if there is a wall at direction, if yes, turn left
		var self = this;
		if ( self._substep > 0 ) {
			return;
		}

		if ( self._dirX < 0 ) {
			self._dirY = 0;
		} else if ( self._dirX > 0 ) {
			self._dirY = 0;
		} else if ( self._dirY < 0 ) {
			self._dirX = 0;
		} else if ( self._dirY > 0 ) {
			self._dirX = 0;
		}


		var pos = self._getActualPosition();
		if ( self._dir === -1 ) {

			// determine direction ///
			var nextEl;

			// if there is an element right:
			nextEl = self._game._getElementAtPos(pos.x+1, pos.y);
			if ( typeof nextEl === UNDEF || nextEl !== null ) {
				// dir right and turn top
				self._dirX = 0;
				self._dirY = -1;
				self._dir = 1;
			} else {
				// if there is an element left:
				nextEl = self._game._getElementAtPos(pos.x-1, pos.y);
				if ( typeof nextEl === UNDEF || nextEl !== null ) {
					// dir left and turn top
					self._dirX = 0;
					self._dirY = -1;
					self._dir = 0;
				} else {
					// if there is an element top:
					nextEl = self._game._getElementAtPos(pos.x, pos.y+1);
					if ( typeof nextEl === UNDEF || nextEl !== null ) {
						// dir right and turn left
						self._dirY = 0;
						self._dirX = -1;
						self._dir = 1;
					} else {
						// if there is an element bottom:
						nextEl = self._game._getElementAtPos(pos.x, pos.y-1);
						if ( typeof nextEl === UNDEF || nextEl !== null ) {
							// dir left and turn left
							self._dirY = 0;
							self._dirX = -1;
							self._dir = 0;
						}
					}

				}
			}

		}
		if ( self._dirX === 0 && self._dirY === 0 ) {
			self._dirX = -1;
		}



		var canMoveForward = false;
		nextEl = self._game._getElementAtPos(pos.x+self._dirX, pos.y+self._dirY);
		if ( nextEl === null ) {
			// can move forward...
			canMoveForward = true;
		}
		//self.turnRight();
		if ( self._dir === 1 ) {
			self._turnRight();
		} else if ( self._dir === 0 ) {
			self._turnLeft();
		}
		var canMoveSide = false;
		nextEl = self._game._getElementAtPos(pos.x+self._dirX, pos.y+self._dirY);

		if ( nextEl === null ) {
			canMoveSide = true;
		} // else keep current direction

		if ( canMoveSide ) {
			// ok
		} else if ( canMoveForward ) {
			// turn back to previous direction
			//self.turnLeft();
			if ( self._dir === 1 ) {
				self._turnLeft();
			} else if ( self._dir === 0 ) {
				self._turnRight();
			}
		} else {
			self._turnLeft();
			self._turnLeft();
		}

	};
	Niki[PROTO]._render = function(context) {
		var self = this;
		if ( this._dirX > 0 ) {
			context.save();
			context.translate(self._x - self._game._renderStartX + HALF_TILE_SIZE, self._y - self._game._renderStartY + HALF_TILE_SIZE);
			context.rotate(180*Math.PI / 180);
			self._gfx._render(context, -HALF_TILE_SIZE, -HALF_TILE_SIZE);
			context.restore();
		} else if ( this._dirY < 0 ) {
			context.save();
			context.translate(self._x - self._game._renderStartX + HALF_TILE_SIZE, self._y - self._game._renderStartY + HALF_TILE_SIZE);
			context.rotate(90*Math.PI / 180);
			self._gfx._render(context, -HALF_TILE_SIZE, -HALF_TILE_SIZE);
			context.restore();
		} else if ( this._dirY > 0 ) {
			context.save();
			context.translate(self._x - self._game._renderStartX + HALF_TILE_SIZE, self._y - self._game._renderStartY + HALF_TILE_SIZE);
			context.rotate(270*Math.PI / 180);
			self._gfx._render(context, -HALF_TILE_SIZE, -HALF_TILE_SIZE);
			context.restore();
		} else {
			// default
			self._gfx._render(context, self._x - self._game._renderStartX, self._y - self._game._renderStartY);
		}
	};






	/* Stone
	===============================================================*/
	function Stone(g, x, y){
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ELEMENT_STONE], x, y, TILE_SIZE, TILE_SIZE);
		self._speed = OBJECT_SPEED;
		self._stepsPerTile = TILE_SIZE/self._speed;
		self._substep = 0; // max TILE_SIZE/self._speed
		self._isWalkable = false;
		self._isPushable = true;
		self._canFall = true;
		self._isSlippery = true;
	}
	Stone[PROTO] = ObjCreate(Entity[PROTO]);
	Stone[PROTO][CONSTRUCTOR] = Stone;

	/* Bomb
	===============================================================*/
	function Bomb(g, x, y){
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ELEMENT_BOMB], x, y, TILE_SIZE, TILE_SIZE);
		self._speed = OBJECT_SPEED;
		self._stepsPerTile = TILE_SIZE/self._speed;
		self._substep = 0; // max TILE_SIZE/self._speed
		self._isWalkable = false;
		self._isPushable = true;
		self._canFall = true;
		self._isSlippery = true;
	}
	Bomb[PROTO] = ObjCreate(Entity[PROTO]);
	Bomb[PROTO][CONSTRUCTOR] = Bomb;

	/* Grass
	 ===============================================================*/
	function Grass(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g._elementGraphics[ELEMENT_GRASS], x, y, TILE_SIZE, TILE_SIZE);
		this._isWalkable = true;
	}
	Grass[PROTO] = ObjCreate(Entity[PROTO]);
	Grass[PROTO][CONSTRUCTOR] = Grass;


	/* Wall
	 ===============================================================*/
	function Wall(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g._elementGraphics[ELEMENT_WALL], x, y, TILE_SIZE, TILE_SIZE);
		this._isWalkable = false;
	}
	Wall[PROTO] = ObjCreate(Entity[PROTO]);
	Wall[PROTO][CONSTRUCTOR] = Wall;


	/* Gem
	 ===============================================================*/
	function Gem(g, gfx, x, y, w, h) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, gfx, x, y, w, h);
		self._isWalkable = true;
		self._value = 0;
		self._collectSound = 0;
	}
	Gem[PROTO] = ObjCreate(Entity[PROTO]);
	Gem[PROTO][CONSTRUCTOR] = Gem;
	Gem[PROTO]._playCollectSound = function() {
		var self = this;
		self._game._audioHandler.play(self._collectSound);
		self._game._audioHandler._playSequence(self._collectSound);
	};

	/* Emerald
	 ===============================================================*/
	function Emerald(g, x, y){
		var self = this;
		Gem[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ELEMENT_EMERALD], x, y, TILE_SIZE, TILE_SIZE);
		self._value = 1;
		self._collectSound = AUDIO_EMERALD;
		g._gemCount+=self._value;

		// emerald sound
		if ( !g._audioHandler.has(AUDIO_EMERALD) ) {
			g._audioHandler.add(AUDIO_EMERALD, 5, [
				[0,,0.0881,0.4996,0.2593,0.8492,,,,,,0.2308,0.6901,,,,,,1,,,,,0.5]
			]);
		}


	}
	Emerald[PROTO] = ObjCreate(Gem[PROTO]);
	Emerald[PROTO][CONSTRUCTOR] = Emerald;

	/* Ruby
	 ===============================================================*/
	function Ruby(g, x, y){
		var self = this;
		Gem[PROTO][CONSTRUCTOR].call(self, g, g._elementGraphics[ELEMENT_RUBY], x, y, TILE_SIZE, TILE_SIZE);
		self._value = 5;
		self._collectSound = AUDIO_RUBY;
		g._gemCount+=self._value;

		// ruby sound
		if ( !g._audioHandler._hasSequence(AUDIO_RUBY) ) {
			g._audioHandler._addSequence(AUDIO_RUBY, new Sequencer({
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
	Ruby[PROTO] = ObjCreate(Gem[PROTO]);
	Ruby[PROTO][CONSTRUCTOR] = Ruby;

	/* Explosion
	===============================================================*/
	function Explosion(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, new Gfx(g._sprite, 48, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), x, y, TILE_SIZE, TILE_SIZE);
		self._isWalkable = true;
		self._ticktick = 10;
		self._isDeadly = true;
	}
	Explosion[PROTO] = ObjCreate(Entity[PROTO]);
	Explosion[PROTO][CONSTRUCTOR] = Explosion;
	Explosion[PROTO].update = function(idx) {
		var self = this;
		if ( --self._ticktick === 0 ) {
			self._game._deleteElementAtIndex(idx);
		}
	};

	/* Lava
	===============================================================*/
	function Lava(g, x, y) {
		Entity[PROTO][CONSTRUCTOR].call(this, g, g._elementGraphics[ELEMENT_LAVA], x, y, TILE_SIZE, TILE_SIZE);
		this._isWalkable = true;
		this._isDeadly = true;
	}
	Lava[PROTO] = ObjCreate(Entity[PROTO]);
	Lava[PROTO][CONSTRUCTOR] = Lava;
	Lava[PROTO]._render = function(context) {
		var self = this;
		var shift = 0;
		if ( self._game._state === Game._STATE_GAME || self._game._state === Game._STATE_EDIT ) {
			shift = self._game._ticks % 256 / 32 | 0;
		}
		self._gfx._render(context, self._x - self._game._renderStartX, self._y - self._game._renderStartY, shift);
	};

	/* Dummy
	 ===============================================================*/
	function Dummy(ref) {
		Entity[PROTO][CONSTRUCTOR].call(this, ref._game, null, ref._x, ref._y, TILE_SIZE, TILE_SIZE);
		this._isWalkable = ref._isWalkable;
		this._ref = ref;
	}
	Dummy[PROTO] = ObjCreate(Entity[PROTO]);
	Dummy[PROTO][CONSTRUCTOR] = Dummy;

	/* Door
	===================================================================*/
	function Door(g, x, y) {
		var self = this;
		Entity[PROTO][CONSTRUCTOR].call(self, g, null, x, y, TILE_SIZE, TILE_SIZE);
		self._isWalkable = false;
		self._isOpen = false;
		self._stepsPerTile = TILE_SIZE/OBJECT_SPEED;

		self._gfx = g._elementGraphics[ELEMENT_DOOR];
		self._gfxOpen = [new Gfx(self._game._sprite, 32, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(self._game._sprite, 32, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
	}
	Door[PROTO] = ObjCreate(Entity[PROTO]);
	Door[PROTO][CONSTRUCTOR] = Door;
	Door[PROTO].open = function() {
		this._isOpen = true;
		this._isWalkable = true;
	};
	Door[PROTO]._render = function(context) {
		var self = this;
		if ( (self._game._state === Game._STATE_GAME || self._game._state === Game._STATE_EDIT) && self._isOpen ) {
			var frame = self._game._ticks % 32 < 16 ? 1 : 0;
			//self.frame = ( self.substep > self.stepsPerTile / 2 ) ? 1 : 0;
			self._gfxOpen[frame]._render(context, self._x - self._game._renderStartX, self._y - self._game._renderStartY);
		} else {
			self._gfx._render(context, self._x - self._game._renderStartX, self._y - self._game._renderStartY);
		}
	};


	/* Door
	 ===================================================================*/
	function Message(g, text, ticktick) {
		this._game = g;
		this._text = text;
		this._ticktick = ticktick;
	}
	Message[PROTO]._render = function(context, msgIndex) {
		this._game.font._renderText(
			context,
			this._text,
			VISIBLE_WIDTH*HALF_TILE_SIZE - this._text.length*HALF_FONT_SIZE,
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
		self._canvas = document.getElementById('g');
		self._context = self._canvas.getContext('2d');
		self._context.mozImageSmoothingEnabled = false;
		self._context.webkitImageSmoothingEnabled = false;
		self._context.msImageSmoothingEnabled = false;
		self._context.imageSmoothingEnabled = false;
		self.font = null;
		self._ticks = 0;

		self._startTime = 0;
		self._renderStartX = 0;
		self._renderStartY = 0;

		self._messages = [];

		self._isReversed = false;
		self._isMuted = false;

		self._enemies = [];

		self._inputHandler = new InputHandler();
		self._audioHandler = new AudioHandler();
		self._prevState = null;
		self._state = Game._STATE_INIT;


		self._editAwaitingGemTarget = false;
		self._editCurrentMapName = '';
		self._loadSaveMapHint = false;
		self._editCurrentElement = ELEMENT_GRASS;
		self._allEditElements = [
			ELEMENT_GRASS,
			ELEMENT_STONE,
			ELEMENT_BOMB,
			ELEMENT_EMERALD,
			ELEMENT_RUBY,
			ELEMENT_LAVA,
			ELEMENT_DOOR,
			ELEMENT_WALL,
			ENEMY_STRIDER,
			ENEMY_NIKI
		];

		self._elementGraphics = [];

		self._sprite = new Sprite('sprites.png', function() {
			self._changeState(Game._STATE_MENU);
			self.font = new Font(self._sprite);

			self._initGraphics();
		}); // load sprite
		self._initAudio();

		self._lastUpdate = new Date().getTime();
		var tick = function() {

			self._ticks++;

			if ( self._state === Game._STATE_INIT ) {
				// do nothing
			} else if ( self._state === Game._STATE_MENU
				|| self._state === Game._STATE_SAVEMAP
				|| self._state === Game._STATE_LOADMAP
				) {

				self._handleInput();
				self._render();

			} if ( self._state === Game._STATE_EDIT
				|| self._state === Game._STATE_GAME
				) {

				self._handleInput();
				self.update();
				self._render();

			} else if ( self._state === Game._STATE_GAMEOVER
				|| self._state === Game._STATE_WON
				) {
				self._handleInput();
			}

			requestAnimationFrame(tick);
		};

		tick();

	}
	Game._STATE_INIT = 0;
	Game._STATE_MENU = 4;
	Game._STATE_GAME = 1;
	Game._STATE_WON = 2;
	Game._STATE_GAMEOVER = 3;
	Game._STATE_EDIT = 5;
	Game._STATE_SAVEMAP = 6;
	Game._STATE_LOADMAP = 7;

	Game[PROTO] = {
		_initAudio: function() {
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
			self._audioHandler._addSequence(AUDIO_BG_MUSIC, new Sequencer({
				loopSpeed: 250, // milliseconds per beat
				instruments: INSTRUMENTS, // The Audio Elements
				loops: loops, // Loops
				song: song, // The actual song
				loop: true, // Loop over and over
				buffer: 1.4 // seconds buffer. ~min Chrome lets us have in a background tab
			}));

			// emerald sound
			self._audioHandler.add(AUDIO_EXPLOSION, 5, [
				[3,,0.131,0.5546,0.4945,0.1142,,,,,,,,,,0.6184,-0.1018,-0.1237,1,,,,,0.5]
			]);
			// open door
			self._audioHandler.add(AUDIO_OPENDOOR, 1, [
				[1,,0.2125,,0.4813,0.4889,,0.2423,,,,,,,,0.7641,,,1,,,,,0.4935]
			]);

			// stone falls to the ground
			self._audioHandler.add(AUDIO_STONE, 5, [
				[3,,0.1535,0.2135,0.0535,0.0535,,-0.2463,,,,,,,,,0.0328,-0.1877,0.8134,,,,,0.4935]
			]);

			self._audioHandler.add(AUDIO_WALK, 1, [
				//[10, 0, 0.1, "sine", 0.2, 0, 0, 40, false, 0, 20,,]
				[3,,0.1017,0.0535,0.0782,0.0735,,-0.536,,,,,,,,,,,1,,,0.0436,,0.2735],
			]);

			self._audioHandler.add(AUDIO_REVERSE, 2, [
				[2,,0.175,,0.4147,0.3131,,0.2175,,,,,,,,0.7216,,,1,,,,,0.2735]
			]);

			self._audioHandler.add(AUDIO_DEATH, 1, [
				//[3,0.0137,0.1196,0.0357,0.7666,0.5988,,-0.541,-0.0004,,,-0.7069,,-0.5796,-0.0053,0.8313,-0.1972,-0.7011,0.9901,0.3907,-0.1717,,0.5852,0.5]
				//[3,0.1405,0.01,0.3854,0.9984,0.0726,,,0.005,,0.1376,0.7791,0.8835,0.8931,-0.0015,0.383,-0.1131,-0.3126,0.4644,0.6286,0.1435,,0.1538,0.5]
				[3,,0.1943,0.6007,0.4404,0.5443,,-0.347,,,,,,,,0.3375,,,1,,,,,0.5]
			]);

			//self._audioHandler._addSequence( 'deathsong', new Sequencer({
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
			//		cymbal: self._audioHandler.instruments.cymbal,
			//		//drum: jsfxr([1,,0.1787,,0.3095,0.17,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		//drum: jsfxr([1,,0.1417,,0.4065,0.2565,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
			//		bass: self._audioHandler.instruments.bass,
			//		drum: self._audioHandler.instruments.drum,
			//		wave: self._audioHandler.instruments.wave
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
			//self._audioHandler._playSequence('deathsong');
		},
		_initGraphics: function() {
			var self = this;
			self._elementGraphics = {};
			self._elementGraphics[ELEMENT_GRASS] = new Gfx(self._sprite, 16, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_STONE] = new Gfx(self._sprite, 0, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_BOMB] = new Gfx(self._sprite, 32, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_EMERALD] = new Gfx(self._sprite, 0, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_RUBY] = new Gfx(self._sprite, 0, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_LAVA] = new Gfx(self._sprite, 48, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_DOOR] = new Gfx(self._sprite, 32, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ELEMENT_WALL] = new Gfx(self._sprite, 32, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);

			self._elementGraphics[ENEMY_STRIDER] = new Gfx(self._sprite, 48, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self._elementGraphics[ENEMY_NIKI] = new Gfx(self._sprite, 64, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		},
		_changeState: function( toState ) {
			var self = this;
			self._prevState = self._state;
			self._state = toState;

			// reset input handler to stop taking key presses/downs to another state
			self._inputHandler._reset();
		},
		_randomMap: function() {

			//todo: should just fill an array with letters and then use _readMap on the array
			// then set the gem target to 0.75 of gem count afterwards

			var obj = {
				map: [],
				gemTarget: 0,
				playerX: 0,
				playerY: 0
			};

			var perc = [
				//[1,ELEMENT_RUBY],
				//[20,ELEMENT_NULL],
				//[2,ELEMENT_BOMB],
				//[6,ELEMENT_EMERALD],
				//[5,ELEMENT_STONE],
				[20,ELEMENT_GRASS],
				//[20,ELEMENT_LAVA],
				//[10,ELEMENT_WALL],
				//[1,ENEMY_NIKI],
				//[1,ENEMY_STRIDER]
			];


			obj.map.push(ELEMENT_GRASS);

			var max = 0;
			perc.forEach(function(item) {
				max+=item[0];
			});
			for ( var i = 1; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
				// grass at player pos
				var rnd = Math.random()*max+1 | 0;
				for ( var j = 0, cur = 0; j < perc.length; j++ ) {
					cur+= perc[j][0];
					if ( rnd < cur ) {
						obj.map.push(perc[j][1]);
						break;
					}
				}
			}

			// generate a door at a random position
			var rand = Math.random()*MAP_SIZE_X*MAP_SIZE_Y | 0;
			obj.map[rand] = ELEMENT_DOOR;

			this._readMap(obj);

			this._gemTarget = (this._gemCount * 0.75) | 0;

		},
		_readMap: function(obj) {
			var self = this;
			self._enemies = [];
			self._elements = [];
			self._rElements = [];
			self._gemCount = 0;

			obj.map.forEach(function(item, i) {
				self._elements.push(null);
				self._rElements.push(null);
				self.__setElementAtIndexByCode(i, obj.map[i]);
			});

			self._gemTarget = obj.gemTarget || self._gemCount;
			self._player = new Player(self, obj.playerX*TILE_SIZE, obj.playerY*TILE_SIZE);
		},
		_loadMap: function(mapName) {
			try {
				//TODO: maybe check if localStorage can be used.
				return JSON.parse(localStorage.getItem('map-'+mapName.toLowerCase()));
			} catch( e ) {
				return false;
			}

		},
		_saveMap: function( mapName ) {
			var self = this;
			var pos = self._player._getActualPosition();
			var map = self._elements.map(self._elementToElementCode);
			self._enemies.forEach(function(enemy) {
				// set enemies on the map object
				var p = enemy._getActualPosition();
				var idx = p.y*MAP_SIZE_X+p.x;
				map[idx] = self._elementToElementCode(enemy);
			});
			//TODO: check if localStorage can be used.
			localStorage.setItem('map-'+mapName.toLowerCase(), JSON.stringify({
				// note: _elements.map = function. not a map of self game
				map: map,
				gemTarget: self._gemTarget,
				playerX: pos.x,
				playerY: pos.y
			}));
			return true;
		},
		__setElementAtIndexByCode: function(idx, elCode, remvoveEnemy) {
			this._setElementAtIndex(
				idx,
				this._elementCodeToElement(elCode, (idx%MAP_SIZE_X) * TILE_SIZE, parseInt(idx/MAP_SIZE_X, 10) * TILE_SIZE),
				remvoveEnemy
			);
		},
		_setElementAtIndex: function(idx, el, removeEnemy) {
			var self = this;

			if ( self._elements.length <= idx || idx < 0 ) {
				return;
			}

			var rel = null;
			var actualX = (idx%MAP_SIZE_X);
			var actualY = parseInt(idx/MAP_SIZE_X, 10);
			var posX = actualX * TILE_SIZE;
			var posY = actualY * TILE_SIZE;

			if ( removeEnemy ) {
				self._enemies.forEach(function(enemy, idx, arr) {
					var ePos = enemy._getActualPosition();
					if ( ePos.x === actualX && ePos.y === actualY ) {
						arr.splice(idx, 1);
					}
				});
			}

			if ( el instanceof Enemy ) {
				self._enemies.push(el);
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

			if ( self._isReversed ) {
				self._elements[idx] = rel;
				self._rElements[idx] = el;
			} else {
				self._elements[idx] = el;
				self._rElements[idx] = rel;
			}
		},
		_deleteElementAtIndex: function(idx) {

			var self = this;
			if ( self._elements.length <= idx || idx < 0 ) {
				return;
			}

			var el = self._elements[idx];
			// remove all dummies
			self._elements.forEach(function(item, i) {
				if ( item instanceof Dummy && item._ref === el ) {
					delete self._elements[i];
					self._setElementAtIndex(i, null);
				}
			});
			var rEl = self._rElements[idx];
			// remove all dummies
			self._rElements.forEach(function(item, i) {
				if ( item instanceof Dummy && item._ref === rEl ) {
					delete self._rElements[i];
					self._setElementAtIndex(i, null);
				}
			});

			delete self._elements[idx];
			//delete this._rElements[idx];
			self._setElementAtIndex(idx, null);
		},
		_getElementAtPos: function(x, y) {

			if ( x < 0 || x >= MAP_SIZE_X || y < 0 || y >= MAP_SIZE_Y ) {
				return undefined;
			}

			if ( this._isReversed ) {
				return this._rElements[y*MAP_SIZE_X+x];
			} else {
				return this._elements[y*MAP_SIZE_X+x];
			}
		},

		_calcGemTarget: function( ) {
			var _gemTarget = 0;
			this._elements.forEach(function(item) {
				_gemTarget += item && item._value ? item._value : 0;
			});
			this._rElements.forEach(function(item) {
				_gemTarget += item && item._value ? item._value : 0;
			});
			return _gemTarget;
		},

		_openDoors: function() {
			var self = this;
			var openedAnyDoor = false;
			self._elements.forEach(function(item) {
				if ( item instanceof Door && !item._isOpen ) {
					item.open();
					openedAnyDoor = true;
				}
			});
			self._rElements.forEach(function(item) {
				if ( item instanceof Door && !item._isOpen ) {
					item.open();
					openedAnyDoor = true;
				}
			});
			if ( openedAnyDoor ) {
				self._messages.push(new Message(self, STR_MSG_DOOR_OPENED, 150));
				self._audioHandler.play(AUDIO_OPENDOOR);
			}

		},

		_elementToElementCode: function( element ) {
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
			} else if ( element instanceof Niki ) {
				return ENEMY_NIKI;
			}
			return ELEMENT_NULL;
		},
		_elementCodeToElement: function( elementCode, x, y ) {
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
				case ENEMY_NIKI: ret = new Niki(self, x, y); break;
				case ELEMENT_NULL:
				default: ret = null; break;
			}
			return ret;
		},

		_drawBackground: function() {
			var self = this;
			var i;
			self._context.fillStyle = '#000';
			self._context.fillRect(0,0, self._canvas.width, self._canvas.height);

			if ( self._state === Game._STATE_EDIT ) {

				// draw grid lines
				self._context.strokeStyle = '#555';
				// draw with offset of the player!
				for ( i = TILE_SIZE-self._renderStartX; i < self._canvas.width+self._renderStartX; i+=TILE_SIZE ) {
					self._context.beginPath();
					self._context.moveTo(i, 0);
					self._context.lineTo(i, self._canvas.height);
					self._context.stroke();
					self._context.closePath();
				}

				for ( i = TILE_SIZE-self._renderStartY; i < self._canvas.height+self._renderStartY; i+=TILE_SIZE ) {
					self._context.beginPath();
					self._context.moveTo(0, i);
					self._context.lineTo(self._canvas.width, i);
					self._context.stroke();
				}
			}
		},
		_handleInput: function(){
			var self = this;

			self._inputHandler._tick();

			var i;
			/* MENU
			=========================================================================== */
			if ( self._state === Game._STATE_MENU ) {
				if ( self._inputHandler._isPressed(VK_E) ) {
					// go to edit mode
					self._startEdit();

				} else if ( self._inputHandler._isPressed(VK_SPACE) ) {
					self._start();
				} else if ( self._inputHandler._isPressed(VK_L) ) {
					// save map
					self._changeState(Game._STATE_LOADMAP);
					self._editCurrentMapName = '';
				}

			}
			/* LOAD MAP
			=========================================================================== */
			else if ( self._state === Game._STATE_LOADMAP ) {

				// get all the input until enter is pressed . this will be the name of the map.
				// or if escape is pressed, cancel savemap state and go back to edit mode

				if ( self._inputHandler._isPressed(VK_RETURN) ) {
					if ( self._editCurrentMapName.length > 0 ) {
						var map = self._loadMap(self._editCurrentMapName);
						if ( map ) {
							if ( self._prevState === Game._STATE_EDIT ) {
								self._startEdit(map);
							} else {
								self._start(map);
							}
						}
					}
				}

				for ( i = 48; i <= 90; i++ ) {
					if ( self._inputHandler._isPressed(i) ) {
						self._editCurrentMapName+=String.fromCharCode(i);
					}
				}
				if ( self._inputHandler._isPressed(VK_BACKSPACE) ) {
					if ( self._editCurrentMapName.length > 0 ) {
						self._editCurrentMapName = self._editCurrentMapName.substring(0, self._editCurrentMapName.length-1);
					}
					if ( !self._editCurrentMapName ) {
						self._editCurrentMapName = '';
					}
				}

				if ( self._inputHandler._isPressed(VK_ESCAPE) ) {
					// go back to edit mode or go back to menu
					if ( self._prevState === Game._STATE_EDIT ) {
						self._changeState(Game._STATE_EDIT);
					} else {
						self._changeState(Game._STATE_MENU);
					}
				}


			}
			/* LOAD MAP
			=========================================================================== */
			else if ( self._state === Game._STATE_SAVEMAP ) {

				// get all the input until enter is pressed . this will be the name of the map.
				// or if escape is pressed, cancel savemap state and go back to edit mode

				if ( self._inputHandler._isPressed(VK_RETURN) ) {
					if ( self._editCurrentMapName.length > 0 ) {
						if ( self._saveMap(self._editCurrentMapName) ) {
							// saved..
							// just go to edit mode
							self._changeState(Game._STATE_EDIT);
							self._messages.push(new Message(self, STR_SAVED_AS_SPACE+'"'+self._editCurrentMapName+'"...', 150));
						} else {
							self._loadSaveMapHint = STR_ERROR_UNABLE_TO_SAVE_MAP;
						}
					}
				}

				for ( i = 48; i <= 90; i++ ) {
					if ( self._inputHandler._isPressed(i) ) {
						self._editCurrentMapName+=String.fromCharCode(i);
						self._loadSaveMapHint = false;
					}
				}
				if ( self._inputHandler._isPressed(VK_BACKSPACE) ) {
					if ( self._editCurrentMapName.length > 0 ) {
						self._editCurrentMapName = self._editCurrentMapName.substring(0, self._editCurrentMapName.length-1);
					}
					if ( self._editCurrentMapName.length === 0 ) {
						self._loadSaveMapHint = STR_HINT_PLEASE_ENTER_NAME;
					}
				}

				if ( self._inputHandler._isPressed(VK_ESCAPE) ) {
					// just go to edit mode
					self._changeState(Game._STATE_EDIT);
				}


			}
			/* EDIT MAP
			=========================================================================== */
			else if ( self._state === Game._STATE_EDIT ) {


				if ( self._inputHandler._isPressed(VK_O) ) {
					/// fill the whole map with the current element type

					self._elements = [];
					self._rElements = [];
					for ( i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
						self._elements.push(null);
						self._rElements.push(null);
						self.__setElementAtIndexByCode(i, self._allEditElements[self._editCurrentElement], 1);
					}

				}

				if ( self._inputHandler._isPressed(VK_P) ) {
					/// fill the whole map with the current element type

					self._elements = [];
					self._rElements = [];
					for ( i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
						self._elements.push(null);
						self._rElements.push(null);
						self.__setElementAtIndexByCode(i, ELEMENT_NULL, 1);
					}
				}

				if ( self._inputHandler._isPressed(VK_SPACE) ) {
					self._editCurrentElement = self._editCurrentElement === self._allEditElements.length-1
						? 0
						: self._editCurrentElement+1;
				}

				if ( self._inputHandler._isPressed(VK_T) ) {
					if ( self._editAwaitingGemTarget !== false ) {
						self._editAwaitingGemTarget = false;
						self._gemTarget = self._calcGemTarget();
					} else {
						// awaiting target gem number
						self._editAwaitingGemTarget = '';
						self._gemTarget = 0;
					}
				}
				if ( self._editAwaitingGemTarget !== false ) {
					for ( i = 48; i < 58; i++ ) {
						// input numbers
						if ( self._inputHandler._isPressed(i) ) {
							self._editAwaitingGemTarget+=''+String.fromCharCode(i);
							self._gemTarget = Number(self._editAwaitingGemTarget);
						}
					}
					if ( self._inputHandler._isPressed(VK_RETURN) ) {
						self._editAwaitingGemTarget = false;
					}
				}

				if ( self._inputHandler._isDown(VK_E) ) {
					var pos = self._player._getActualPosition();
					self.__setElementAtIndexByCode(pos.y*MAP_SIZE_X+pos.x, self._allEditElements[self._editCurrentElement], 1);
				}

				if ( self._inputHandler._isDown(VK_X) ) {
					var pos = self._player._getActualPosition();
					self._setElementAtIndex(pos.y*MAP_SIZE_X+pos.x, null, 1);
				}

				if ( self._inputHandler._isPressed(VK_L) ) {
					// load map
					//self._editCurrentMapName = '';
					self._changeState(Game._STATE_LOADMAP);
				}
				if ( self._inputHandler._isPressed(VK_S) ) {
					// save map
					//self._editCurrentMapName = '';
					self._changeState(Game._STATE_SAVEMAP);
				}

				if ( self._player._substep === 0 ) {

					if ( self._inputHandler._isDown(VK_UP) ) {
						self._player._dirX = 0;
						self._player._dirY = -1;
					} else if ( self._inputHandler._isDown(VK_DOWN) ) {
						self._player._dirX = 0;
						self._player._dirY = 1;
					} else if ( self._inputHandler._isDown(VK_LEFT) ) {
						self._player._dirX = -1;
						self._player._dirY = 0;
					} else if ( self._inputHandler._isDown(VK_RIGHT) ) {
						self._player._dirX = 1;
						self._player._dirY = 0;
					} else {
						self._player._dirX = 0;
						self._player._dirY = 0;
					}

					if ( self._inputHandler._isPressed(VK_R) ) {
						self._isReversed = !self._isReversed;
						self._audioHandler.play(AUDIO_REVERSE);
					}
				}

				if ( self._inputHandler._isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
					self._changeState(Game._STATE_MENU);
				}

			}
			/* GAME
			=========================================================================== */
			else if ( self._state === Game._STATE_GAME && self._player._substep === 0 ) {

				if ( self._inputHandler._isDown(VK_UP) ) {
					self._player._dirX = 0;
					self._player._dirY = -1;
				} else if ( self._inputHandler._isDown(VK_DOWN) ) {
					self._player._dirX = 0;
					self._player._dirY = 1;
				} else if ( self._inputHandler._isDown(VK_LEFT) ) {
					self._player._dirX = -1;
					self._player._dirY = 0;
				} else if ( self._inputHandler._isDown(VK_RIGHT) ) {
					self._player._dirX = 1;
					self._player._dirY = 0;
				} else {
					self._player._dirX = 0;
					self._player._dirY = 0;
				}

				if ( self._inputHandler._isPressed(VK_R) ) {
					self._isReversed = !self._isReversed;
					self._audioHandler.play(AUDIO_REVERSE);
				}

				if ( self._inputHandler._isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
					self._changeState(Game._STATE_MENU);
				}

			}
			/* OTHER STATES
			=========================================================================== */
			else {


				if ( self._inputHandler._isPressed(VK_ESCAPE) ) {
					// go to menu for now. later maybe add pause.
					self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
					self._changeState(Game._STATE_MENU);
				}

			}

			if ( self._inputHandler._isPressed(VK_M) ) {
				self._isMuted = !self._isMuted;
				self._audioHandler.mute(self._isMuted);
			}

		},

		_maybeCreateExplosion: function(x, y) {

			var self = this;

			// check if we hit a bomb, if yes, explode them too

			var el = self._getElementAtPos(x,y);

			if ( typeof el === UNDEF ) {
				return;
			}
			if ( el instanceof Wall ) {
				return;
			}

			var chkEl = el instanceof Dummy ? el._ref : el;

			// if there is already an explosion, continue
			if ( chkEl instanceof Explosion ) {
				return;
			}


			// if there is a bomb, then create an explosion at the position where the thing will be falling to
			if ( chkEl instanceof Bomb ) {
				self._createExplosion(x, y);
			} else if ( chkEl !== null ) {
				// delete original element
				var pos = chkEl._getActualPosition();
				self._deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
			}

			// add explosion entity at the place
			self.__setElementAtIndexByCode(y*MAP_SIZE_X+x, ELEMENT_EXPLOSION);

		},

		// the x and y given to this function are coordinates, not real x y positions
		_createExplosion: function(px, py) {

			var self = this;

			// set desired place to explosion
			self.__setElementAtIndexByCode(py*MAP_SIZE_X+px, ELEMENT_EXPLOSION);


			// set surrounding places to explosions (maybe)
			self._maybeCreateExplosion(px-1, py-1);
			self._maybeCreateExplosion(px, py-1);
			self._maybeCreateExplosion(px+1, py-1);

			self._maybeCreateExplosion(px-1, py);
			self._maybeCreateExplosion(px+1, py);

			self._maybeCreateExplosion(px-1, py+1);
			self._maybeCreateExplosion(px, py+1);
			self._maybeCreateExplosion(px+1, py+1);

			self._audioHandler.play(AUDIO_EXPLOSION);
		},


		_anyMobileEntityAt: function(x, y){
			var self = this;
			var playerPos = self._player._getActualPosition();
			var _anyMobileEntityAt = playerPos.x === x && playerPos.y === y;
			if ( !_anyMobileEntityAt ) {
				self._enemies.forEach(function(enemy) {
					var p = enemy._getActualPosition();
					_anyMobileEntityAt = _anyMobileEntityAt || p.x === x && p.y === y;
				});
			}
			return _anyMobileEntityAt;
		},

		update: function() {
			var self = this;


			var currentTime = new Date().getTime();
			if ( currentTime - self._lastUpdate <= 1000/60 ) {
				return;
			}

			self._lastUpdate = currentTime;

			// then move the enemies and elements

			if ( self._state === Game._STATE_GAME ) {

				// move enemies
				self._enemies.forEach(function(enemy) {
					enemy.update();
				});

				var elementsToUpdate = self._isReversed ? self._rElements : self._elements;
				elementsToUpdate.forEach(function(item, idx) {
					if ( item === null ) {
						return;
					}
					item.update(idx);
				});
			}


			var player = self._player;

			// if player has any direction, he can possible move, otherwise he cant
			var canMove = player._dirX !== 0 || player._dirY !== 0;

			if ( canMove && player._substep === 0 ) {
				// only if player is in substep 0, he can start moving so only then we have to check for map bounds etc.

				// check if player hits boundry of map
				if ( player._x+player._dirX < 0 || player._x+player._dirX > MAP_SIZE_X*TILE_SIZE-TILE_SIZE
					|| player._y+player._dirY < 0 || player._y+player._dirY > MAP_SIZE_Y*TILE_SIZE-TILE_SIZE
				) {
					// have hit boundries! cant move
					canMove = false;
				} else if ( self._state === Game._STATE_GAME ) {

					var playerPos = player._getActualPosition();

					var nextEl= self._getElementAtPos(playerPos.x+player._dirX, playerPos.y+player._dirY);
					if ( typeof nextEl === UNDEF ) {
						canMove = false;
					} else if ( nextEl === null || nextEl._isWalkable ) {
						// ok
					} else if ( player._dirY !== 0 || !nextEl._isPushable ) {
						// moving vertically, but in the direction of the player is some obstacle

						// or else:
						// we know now that the player is moving horizontally so we check if the
						// element in player direction is pushable, if not the player cant move

						canMove = false;
					} else if ( self._getElementAtPos(playerPos.x+player._dirX+player._dirX, playerPos.y) === null ) {
						// player is moving horizontally and nextel is pushable
						// check next next element => only if it is null can the player move
						// ok
						if ( nextEl._dirX === 0 && nextEl._dirY === 0 ) {
							nextEl._dirX = player._dirX;
						}
					} else {
						canMove = false;
					}

				}

			}

			if ( canMove ) {
				player._move();
				player._substep = player._substep < player._stepsPerTile-1 ? player._substep+1 : 0;
				if ( player._substep === 0 ) {
					self._audioHandler.play(AUDIO_WALK);
				}
			}

			if ( self._state === Game._STATE_GAME ) {

				// check element collisions
				elementsToUpdate.forEach(function(element) {
					// if the thing is null or was not falling, dont check collisions
					if ( element === null || !element._wasFalling ) {
						return;
					}

					// when the thing is falling and collided with the player, let the player die!
					if ( element._y <= player._y && self._overlaps(element, player) ) {
						self._changeState(Game._STATE_GAMEOVER);
						self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
						self._audioHandler.play(AUDIO_DEATH);
						//self._audioHandler._playSequence('deathsong');
						return;
					}

					// when the thing is falling and collided with an enemy, let the enemy die!
					self._enemies.forEach(function(enemy, idx, arr) {
						if ( element._x > enemy._x || !self._overlaps(element, enemy) ) {
							return;
						}
						arr.splice(idx,1);

						var p = element._getActualPosition();
						self._setElementAtIndex(p.y*MAP_SIZE_X+p.x, null);
						p = enemy._getActualPosition();
						if ( element instanceof Bomb ) {
							self._createExplosion(p.x, p.y);
						} else {
							// create explosion only at this one field
							self._maybeCreateExplosion(p.x, p.y);
						}
					});

				});
				// player pos to index:

				// check enemy collisions
				self._enemies.forEach(function(enemy, idx, arr) {
					if ( self._overlaps(enemy, self._player) ) {
						// die!!!! :3
						self._changeState(Game._STATE_GAMEOVER);
						self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
						self._audioHandler.play(AUDIO_DEATH);
					}


					var p = enemy._getActualPosition();
					var elAtEntity= self._getElementAtPos(p.x, p.y);
					if ( elAtEntity === null ) {
					} else if ( elAtEntity._isDeadly ) {
						arr.splice(idx,1);
					}
				});


				var playerPosAfter = player._getActualPosition();
				var elIndex = playerPosAfter.y*MAP_SIZE_X+playerPosAfter.x;
				var elAtPlayer= self._getElementAtPos(playerPosAfter.x, playerPosAfter.y);
				if ( elAtPlayer === null ) {
				} else if ( elAtPlayer._isDeadly ) {

					// die!!!! :3
					self._changeState(Game._STATE_GAMEOVER);
					self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
					self._audioHandler.play(AUDIO_DEATH);

				} else if ( elAtPlayer instanceof Grass ) {

					self._deleteElementAtIndex(elIndex);

				} else if ( elAtPlayer instanceof Gem ) {

					player._gemCount+= elAtPlayer._value;
					self._deleteElementAtIndex(elIndex);
					if ( player._gemCount >= self._gemTarget ) {
						// open all doors
						self._openDoors();
					}
					elAtPlayer._playCollectSound();

				} else if ( player._substep === 0 && elAtPlayer instanceof Door && elAtPlayer._isOpen ) {
					// when player is on the door, he won the game! :p

					// won
					self._changeState(Game._STATE_WON);
					player._dirX = 0;
					player._dirY = 0;
					self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
				}


			}


		},

		_overlaps: function( item1, item2, threshold ) {
			// check if overlap with a threshold
			threshold = threshold || TILE_SIZE/8; //default threshold quarter of a tile (/8 because it counts twice)
			return (
				item1._x+threshold < item2._x+item2._w-threshold
				&& item1._x+item1._w-threshold > item2._x+threshold
				&& item1._y+threshold < item2._y+item2._h-threshold
				&& item1._y+item1._h-threshold > item2._y+threshold
			);
		},
		_drawEnemies: function() {
			var self = this;
			self._enemies.forEach(function(enemy) {
				enemy._render(self._context);
			});
			//self._player.render(self._context);
		},
		_drawElements: function() {
			var self=  this;

			self._renderStartX = self._player._x - VISIBLE_WIDTH*HALF_TILE_SIZE;
			self._renderStartY = self._player._y - VISIBLE_HEIGHT*HALF_TILE_SIZE;
			if ( self._renderStartX < 0 ) {
				self._renderStartX = 0;
			}
			if ( self._renderStartY < 0 ) {
				self._renderStartY = 0;
			}
			if ( self._renderStartX+VISIBLE_WIDTH*TILE_SIZE > MAP_SIZE_X*TILE_SIZE ) {
				self._renderStartX = MAP_SIZE_X*TILE_SIZE - VISIBLE_WIDTH*TILE_SIZE;
			}
			if ( self._renderStartY+VISIBLE_HEIGHT*TILE_SIZE > MAP_SIZE_Y*TILE_SIZE ) {
				self._renderStartY = MAP_SIZE_Y*TILE_SIZE - VISIBLE_HEIGHT*TILE_SIZE;
			}

			var elementsToRender = self._isReversed ? self._rElements : self._elements;
			elementsToRender.forEach(function(item) {
				if ( item === null
					|| item._x < self._renderStartX-TILE_SIZE
					|| item._x > self._renderStartX+VISIBLE_WIDTH*TILE_SIZE + TILE_SIZE
					|| item._y < self._renderStartY-TILE_SIZE
					|| item._y > self._renderStartY+VISIBLE_HEIGHT*TILE_SIZE + TILE_SIZE
					|| !item._gfx
					) {
					return;
				}

				item._render(self._context);

			});
		},

		_drawHud: function() {
			var self = this;


			var hudRightElement = new Gfx(self._sprite, 48, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			var hudLeftElement = new Gfx(self._sprite, 48, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			var hudCenterElement = new Gfx(self._sprite, 48, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);

			for ( var i = 1; i < VISIBLE_WIDTH-1; i++ ) {
				hudCenterElement._render(self._context, i*TILE_SIZE, VISIBLE_HEIGHT*TILE_SIZE);
			}
			hudLeftElement._render(self._context, 0, VISIBLE_HEIGHT*TILE_SIZE);
			hudRightElement._render(self._context, VISIBLE_WIDTH*TILE_SIZE-TILE_SIZE, VISIBLE_HEIGHT*TILE_SIZE);

			var timeNow = new Date().getTime();
			var timeElapsed = (0.5+(timeNow - self._startTime)/1000) | 0;
			var statusText = '';
			if ( self._state === Game._STATE_GAMEOVER ) {
				statusText = STR_STATUS_TEXT_GAMEOVER;
			} else if ( self._state === Game._STATE_WON ) {
				statusText = STR_STATUS_TEXT_WIN;
			} else if ( self._state === Game._STATE_GAME ) {
				statusText = STR_GEMS_COLON+ self._player._gemCount + '/' + self._gemTarget;
			} else if ( self._state === Game._STATE_EDIT ) {
				statusText = STR_GEM_TARGET_COLON+self._gemTarget;
			}


			if ( self._state === Game._STATE_EDIT ) {
				var x = statusText.length*FONT_SIZE+FONT_SIZE+HALF_FONT_SIZE,
					y = VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE;



				self.font._renderText(
					self._context,
					STR_EDIT_HELP_1,
					HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE-FONT_SIZE-HALF_FONT_SIZE,
					16 // smaller font
				);
				self.font._renderText(
					self._context,
					STR_EDIT_HELP_2,
					HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE-FONT_SIZE-HALF_FONT_SIZE+24,
					16 // smaller font
				);


				self._allEditElements.forEach(function(e, i) {

					if ( self._editCurrentElement === i ) {
						self._context.fillStyle = '#f00';
						self._context.fillRect(x-2,y-2, FONT_SIZE+4, FONT_SIZE+4);
					}

					if ( self._elementGraphics[e] ) {
						self._elementGraphics[e]._render(self._context,x,y,undefined,undefined,FONT_SIZE);
					}
					x+= FONT_SIZE+HALF_FONT_SIZE;

				});

			}

			self.font._renderText(
				self._context,
				statusText,
				HALF_FONT_SIZE,
				VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE
			);

			if ( self._state === Game._STATE_GAME || self._state === Game._STATE_GAMEOVER || self._state === Game._STATE_WON ) {

				var s = timeElapsed%60;
				var timeText = (timeElapsed/60 | 0)+':'+(s > 9 ? s : '0'+s);
				self.font._renderText(
					self._context,
					timeText,
					VISIBLE_WIDTH*TILE_SIZE - timeText.length * FONT_SIZE - HALF_FONT_SIZE,
					VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE
				);
			}

			var msgOffset = 0;
			self._messages.forEach(function(msg, idx, arr) {
				if ( --msg._ticktick === 0 ) {
					arr.splice(idx,1);
				}
				msg._render(self._context, msgOffset++);
			});


		},

		_drawMenu: function() {
			var self = this;
			var y = 50;
			self.font._renderText(self._context, STR_MENU_START_RANDOM_GAME, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font._renderText(self._context, STR_MENU_LOAD_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font._renderText(self._context, STR_MENU_EDIT_MAP, 50, y);
		},

		_drawSave: function() {
			var self = this;
			var y = 50;
			self.font._renderText(self._context, STR_SAVE_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font._renderText(self._context, STR_NAME_COLON+self._editCurrentMapName, 50, y);
			if ( self._loadSaveMapHint ) {
				y+=FONT_SIZE+HALF_FONT_SIZE;
				y+=FONT_SIZE+HALF_FONT_SIZE;
				self.font._renderText(self._context, STR_HINT_COLON+self._loadSaveMapHint, 50, y);
			}
		},
		_drawLoad: function() {
			var self = this;
			var y = 50;
			self.font._renderText(self._context, STR_LOAD_MAP, 50, y);
			y+=FONT_SIZE+HALF_FONT_SIZE;
			self.font._renderText(self._context, STR_NAME_COLON+self._editCurrentMapName, 50, y);
			if ( self._loadSaveMapHint ) {
				y+=FONT_SIZE+HALF_FONT_SIZE;
				y+=FONT_SIZE+HALF_FONT_SIZE;
				self.font._renderText(self._context, STR_HINT_COLON+self._loadSaveMapHint, 50, y);
			}
		},

		_render: function() {
			var self = this;
			self._drawBackground();
			if ( self._state === Game._STATE_MENU ) {
				self._drawMenu();
			} else if ( self._state === Game._STATE_LOADMAP ) {
				self._drawLoad();
			} else if ( self._state === Game._STATE_SAVEMAP ) {
				self._drawSave();
			} else {
				// render everything
				self._drawElements();
				self._drawEnemies();
				self._drawHud();
				self._player._render(self._context);
			}
		},

		_start: function( mapObj ) {
			var self = this;

			self._startTime = new Date().getTime();

			self._messages = [];
			//self._messages.push(new Message(this, 'Welcome..', 300));
			//self._messages.push(new Message(this, '...to the jungle..', 300));

			self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
			self._audioHandler._playSequence(AUDIO_BG_MUSIC);

			if ( mapObj ) {
				self._readMap(mapObj);
			} else {
				self._randomMap();
			}
			self._changeState(Game._STATE_GAME);
		},

		_startEdit: function( map ) {
			var self = this;
			self._startTime = new Date().getTime();

			self._audioHandler._stopSequence(AUDIO_BG_MUSIC);
			self._audioHandler._playSequence(AUDIO_BG_MUSIC);

			if ( map ) {
				self._readMap(map);
			} else {
				self._elements = [];
				self._rElements = [];
				self._enemies = [];
				self._gemCount = 0;
				self._gemTarget = 0;
				for ( var i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
					self._elements.push(null);
					self._rElements.push(null);
				}
				self._player = new Player(self, 0, 0);
			}


			self._editCurrentElement = 0;
			self._changeState(Game._STATE_EDIT);

		}
	};


	WndAddEventListener('load', function() {
		new Game();
	});

})();