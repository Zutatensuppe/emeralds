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

	// some keys:
	const VK_LEFT = 37;
	const VK_RIGHT = 39;
	const VK_UP = 38;
	const VK_DOWN = 40;
	const VK_SPACE = 32;
	const VK_R = 82;
	const VK_M = 77;
	const VK_E = 69;

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

	var ELEMENT_GRASS = 0;
	var ELEMENT_STONE = 1;
	var ELEMENT_BOMB = 2;
	var ELEMENT_EMERALD = 3;
	var ELEMENT_RUBY = 4;
	var ELEMENT_LAVA = 5;
	var ELEMENT_DOOR = 6;
	var ELEMENT_NULL = 7;

	var UNDEF = 'undefined';
	var PROTO = 'prototype';
	var CONSTRUCTOR = 'constructor';


	/////////////////////////////////////////////////////////////////
	// Math Random Wrapper to save some bytes
	// (Saves bytes from 4 usages upwards)
	/////////////////////////////////////////////////////////////////
	function Rnd() {
		return Math.random();
	}





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
	Sprite[PROTO] = {
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
	Gfx[PROTO] = {
		render: function(screen, destX, destY, shiftX, shiftY, TS) {

			shiftX = shiftX || 0;
			shiftY = shiftY || 0;

			TS = TS || TILE_SIZE;
			if ( shiftX || shiftY ) {
				// wrap the sprite image

				var ratioX = TS / this.w;
				var ratioY = TS / this.h;

				var w1, w2, h1, h2;
				if ( shiftX ) {
					w2 = Math.abs(shiftX);
					w1 = this.w - w2;
				} else {
					w2 = this.w;
					w1 = this.w;
				}
				if ( shiftY ) {
					h2 = Math.abs(shiftY);
					h1 = this.h - h2;
				} else {
					h2 = this.h;
					h1 = this.h;
				}

				// render part 1
				this.sprite.render(
					screen,
					this.x + shiftX,
					this.y + shiftY,
					w1,
					h1,
					destX,
					destY,
					w1*ratioX,
					h1*ratioY
				);

				// render part 2
				this.sprite.render(
					screen,
					this.x,
					this.y,
					w2,
					h2,
					shiftX ? (destX + w1 * ratioX ) : destX,
					shiftY ? (destY + h1 * ratioY ) : destY,
					w2*ratioX,
					h2*ratioY
				);

			} else {

				this.sprite.render(screen, this.x, this.y, this.w, this.h, destX, destY, TS, TS);

			}

		}
	};

	function Font( sprite ) {
		this.letters = ''+
			'abcdefg'+
			'hijklmn'+
			'opqrstu'+
			'vwxyz?!'+
			':,.1234'+
			'567890/';
		this.sprite = sprite;
	}
	Font[PROTO] = {
		posInSprite: function(letter) {
			var xstart = 64;
			var ystart = 0;
			// 7 letters per col
			var letterIdx = this.letters.indexOf(letter);
			if ( letterIdx >= 0 ) {
				// found the letter
				return {
					x: xstart + ((letterIdx/7) | 0)*8,
					y: ystart + ((letterIdx%7)*8)
				};
			}
			return false;
		},
		renderText: function(screen, text, x, y) {
			text = text.toLowerCase();
			var _x = x;
			for ( var i = 0, iLen = text.length; i < iLen; i++ ) {
				var chr = text.charAt(i);
				if ( chr === "\n" ) {
					y+=SPRITE_FONT_SIZE*2;
					_x = x;
					continue;
				}
				var posInSprite = this.posInSprite(chr);
				if ( posInSprite ) {
					this.sprite.render(screen, posInSprite.x, posInSprite.y, SPRITE_FONT_SIZE, SPRITE_FONT_SIZE, _x, y, FONT_SIZE, FONT_SIZE);
				}
				_x+=FONT_SIZE;
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
	VirtualKey[PROTO] = {
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

		this.keys = {};
		this.keys[VK_LEFT] = new VirtualKey();
		this.keys[VK_RIGHT] = new VirtualKey();
		this.keys[VK_UP] = new VirtualKey();
		this.keys[VK_DOWN] = new VirtualKey();
		this.keys[VK_SPACE] = new VirtualKey();
		this.keys[VK_R] = new VirtualKey();
		this.keys[VK_M] = new VirtualKey();
		this.keys[VK_E] = new VirtualKey();

		var self = this;
		window.addEventListener('keydown', function(e) {
			self.toggle(e, true);
		});
		window.addEventListener('keyup', function(e) {
			self.toggle(e, false);
		});
	}
	InputHandler[PROTO] = {
		toggle: function(e, pressed) {
			if ( this.keys[e.keyCode] ) {
				this.keys[e.keyCode].toggle(pressed);
				e.preventDefault();
			}
		},
		tick: function() {
			var self = this;
			for ( var idx in self.keys ) {
				if ( ! self.keys.hasOwnProperty(idx) ) {
					continue;
				}
				self.keys[idx].tick();
			}
		},
		isDown: function(keyCode) {
			return this.keys[keyCode] && this.keys[keyCode].isDown;
		},
		isPressed: function(keyCode) {
			return this.keys[keyCode] && this.keys[keyCode].isPressed;
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

			this.isMuted = mute;
			for ( var key in this.sequences ) {
				if ( this.sequences.hasOwnProperty(key) ) {
					this.sequences[key].mute(mute);
				}
			}
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
			return !! this.sounds[key];
		},
		/**
		 *
		 * @param key              Sound name / Key in the sound array
		 * @param simultanousCount How many sounds of this key can be played simultanously
		 *                         This should be a higher number for longer playing sounds.
		 * @param soundSettings    Sound settings for jsfxr
		 */
		add: function(key, simultanousCount, soundSettings) {

			// create a new array with information about the sound for the given key
			this.sounds[key] = [];

			// foreach sound setting we have given for the key, push an entry
			soundSettings.forEach(function(item, idx) {
				this.sounds[key].push({
					current: 0,
					count: simultanousCount,
					pool: []
				});
				// push as many entries as we want
				for ( var i = 0; i < simultanousCount; i++ ) {
					var audio = new Audio();
					audio.src = jsfxr(item);
					this.sounds[key][idx].pool.push(audio);

					//this.sounds[key][idx].pool.push(item);
				}
			}, this);
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
			var rand = sound.length > 1 ? ((Rnd()*sound.length) | 0) : 0;
			//console.log('playing sound "'+key+'", variant '+rand);
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
		this.isDeadly = false;
		this.isFalling = false;
		this.wasFalling = false;
	}
	Entity[PROTO].getActualPosition = function() {
		return {
			x: (this.x/TILE_SIZE + 0.5) | 0,
			y: (this.y/TILE_SIZE + 0.5) | 0
		};
	};
	Entity[PROTO].move = function() {
			this.x = this.x+this.dirX*this.speed;
			this.y = this.y+this.dirY*this.speed;
		};
	Entity[PROTO].unmove = function() {
			this.x = this.x-this.dirX*this.speed;
			this.y = this.y-this.dirY*this.speed;
		};
	Entity[PROTO].render = function(context) {
		this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
	};


	/* The Player
	===============================================================*/
	function Player(g, x, y) {
		Entity[PROTO][CONSTRUCTOR].call(this, g, null, x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.gemCount = 0;

		this.gfx = new Gfx(g.sprite, 16, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		this.gfxRight = [new Gfx(g.sprite, 32, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		this.gfxLeft = [new Gfx(g.sprite, 0, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 0, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		this.gfxDown = [new Gfx(g.sprite, 16, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
		this.gfxUp = [new Gfx(g.sprite, 0, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(g.sprite, 16, 80, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];

	}
	Player[PROTO] = Object.create(Entity[PROTO]);
	Player[PROTO][CONSTRUCTOR] = Player;
	Player[PROTO].render = function(context) {

		var screenX = this.x - this.game.renderStartX;
		var screenY = this.y - this.game.renderStartY;

		if (  this.game.state === Game.STATE_GAME || this.game.state === Game.STATE_EDIT ) {
			var frame = this.game.ticks % 24 < 12 ? 1 : 0;
			if ( this.dirX < 0 ) {
				this.gfxLeft[frame].render(context, screenX, screenY);
			} else if ( this.dirX > 0 ) {
				this.gfxRight[frame].render(context, screenX, screenY);
			} else if ( this.dirY > 0 ) {
				this.gfxDown[frame].render(context, screenX, screenY);
			} else if ( this.dirY < 0 ) {
				this.gfxUp[frame].render(context, screenX, screenY);
			} else {
				this.gfx.render(context, screenX, screenY);
			}
		} else {
			this.gfx.render(context, screenX, screenY);
		}
	};

	/* Enemy
	===============================================================*/
	function Enemy(gfx){
	}
	Enemy[PROTO] = Object.create(Entity[PROTO]);
	Enemy[PROTO][CONSTRUCTOR] = Enemy;

	/* Stone
	===============================================================*/
	function Stone(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_STONE], x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.isWalkable = false;
		this.isPushable = true;
	}
	Stone[PROTO] = Object.create(Entity[PROTO]);
	Stone[PROTO][CONSTRUCTOR] = Stone;

	/* Bomb
	===============================================================*/
	function Bomb(g, x, y){
		Entity[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_BOMB], x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.isWalkable = false;
		this.isPushable = true;
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


	/* Gem
	 ===============================================================*/
	function Gem(g, gfx, x, y, w, h) {
		Entity[PROTO][CONSTRUCTOR].call(this, g, gfx, x, y, w, h);
		this.isWalkable = true;
		this.value = 0;
		this.collectSound = '';
	}
	Gem[PROTO] = Object.create(Entity[PROTO]);
	Gem[PROTO][CONSTRUCTOR] = Gem;
	Gem[PROTO].playCollectSound = function() {
		this.game.audioHandler.play(this.collectSound);
		this.game.audioHandler.playSequence(this.collectSound);
	};

	/* Emerald
	 ===============================================================*/
	function Emerald(g, x, y){
		Gem[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_EMERALD], x, y, TILE_SIZE, TILE_SIZE);
		this.value = 1;
		this.collectSound = AUDIO_EMERALD;
		g.gemCount+=this.value;

		// emerald sound
		if ( !g.audioHandler.has(AUDIO_EMERALD) ) {
			g.audioHandler.add(AUDIO_EMERALD, 5,
				[
					[0,,0.0881,0.4996,0.2593,0.8492,,,,,,0.2308,0.6901,,,,,,1,,,,,0.5]
				]
			);
		}


	}
	Emerald[PROTO] = Object.create(Gem[PROTO]);
	Emerald[PROTO][CONSTRUCTOR] = Emerald;

	/* Ruby
	 ===============================================================*/
	function Ruby(g, x, y){
		Gem[PROTO][CONSTRUCTOR].call(this, g, g.elementGraphics[ELEMENT_RUBY], x, y, TILE_SIZE, TILE_SIZE);
		this.value = 5;
		this.collectSound = AUDIO_RUBY;
		g.gemCount+=this.value;

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
		Entity[PROTO][CONSTRUCTOR].call(this, g, new Gfx(g.sprite, 48, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
		this.ticktick = 10;
		this.isDeadly = true;
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
		var shift = 0;
		if ( this.game.state === Game.STATE_GAME || this.game.state === Game.STATE_EDIT ) {
			shift = this.game.ticks % 256 / 32 | 0;
		}
		this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY, shift);
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
		Entity[PROTO][CONSTRUCTOR].call(this, g, null, x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = false;
		this.isOpen = false;
		this.stepsPerTile = TILE_SIZE/OBJECT_SPEED;

		this.gfx = g.elementGraphics[ELEMENT_DOOR];
		this.gfxOpen = [new Gfx(this.game.sprite, 32, 48, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE), new Gfx(this.game.sprite, 32, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE)];
	}
	Door[PROTO] = Object.create(Entity[PROTO]);
	Door[PROTO][CONSTRUCTOR] = Door;
	Door[PROTO].open = function() {
		this.isOpen = true;
		this.isWalkable = true;
	};
	Door[PROTO].render = function(context) {
		if ( (this.game.state === Game.STATE_GAME || this.game.state === Game.STATE_EDIT) && this.isOpen ) {
			var frame = this.game.ticks % 32 < 16 ? 1 : 0;
			//this.frame = ( this.substep > this.stepsPerTile / 2 ) ? 1 : 0;
			this.gfxOpen[frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else {
			this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
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
		this.canvas = document.getElementById('g');
		this.context = this.canvas.getContext('2d');
		this.context.mozImageSmoothingEnabled = false;
		this.context.webkitImageSmoothingEnabled = false;
		this.context.msImageSmoothingEnabled = false;
		this.context.imageSmoothingEnabled = false;
		this.font = null;
		this.ticks = 0;

		this.startTime = 0;
		this.renderStartX = 0;
		this.renderStartY = 0;

		//self.canvas.width  = 1024; //window.innerWidth;
		//self.canvas.height = 768; //window.innerHeight;

		this.messages = [];

		this.isReversed = false;

		this.isMuted = false;

		this.inputHandler = new InputHandler();
		this.audioHandler = new AudioHandler();
		this.state = Game.STATE_INIT;


		this.editCurrentElement = ELEMENT_GRASS;
		this.allEditElements = [
			ELEMENT_GRASS,
			ELEMENT_STONE,
			ELEMENT_BOMB,
			ELEMENT_EMERALD,
			ELEMENT_RUBY,
			ELEMENT_LAVA,
			ELEMENT_DOOR,
			ELEMENT_NULL
		];

		this.elementGraphics = [];

		this.sprite = new Sprite('sprites.png', function() {
			self.state = Game.STATE_MENU;
			self.font = new Font(self.sprite);

			self.elementGraphics = {};
			self.elementGraphics[ELEMENT_GRASS] = new Gfx(self.sprite, 16, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_STONE] = new Gfx(self.sprite, 0, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_BOMB] = new Gfx(self.sprite, 32, 0, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_EMERALD] = new Gfx(self.sprite, 0, 16, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_RUBY] = new Gfx(self.sprite, 0, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_LAVA] = new Gfx(self.sprite, 48, 64, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
			self.elementGraphics[ELEMENT_DOOR] = new Gfx(self.sprite, 32, 32, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE);
		}); // load sprite



		// Milliseconds per beat.
		var loopSpeed = 250;
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
		this.audioHandler.addSequence(AUDIO_BG_MUSIC, new Sequencer({
			loopSpeed: loopSpeed, // milliseconds per beat
			instruments: INSTRUMENTS, // The Audio elements
			loops: loops, // Loops
			song: song, // The actual song
			loop: true, // Loop over and over
			buffer: 1.4 // seconds buffer. ~min Chrome lets us have in a background tab
		}));

		// emerald sound
		this.audioHandler.add(AUDIO_EXPLOSION, 5,
			[
				[3,,0.131,0.5546,0.4945,0.1142,,,,,,,,,,0.6184,-0.1018,-0.1237,1,,,,,0.5]

			]
		);
		// open door
		this.audioHandler.add(AUDIO_OPENDOOR, 1,
			[
				[1,,0.2125,,0.4813,0.4889,,0.2423,,,,,,,,0.7641,,,1,,,,,0.4935]
			]
		);

		// stone falls to the ground
		this.audioHandler.add(AUDIO_STONE, 5,
			[
				[3,,0.1535,0.2135,0.0535,0.0535,,-0.2463,,,,,,,,,0.0328,-0.1877,0.8134,,,,,0.4935]
			]
		);

		this.audioHandler.add(AUDIO_WALK, 1,
			[
				//[10, 0, 0.1, "sine", 0.2, 0, 0, 40, false, 0, 20,,]
				[3,,0.1017,0.0535,0.0782,0.0735,,-0.536,,,,,,,,,,,1,,,0.0436,,0.2735],
			]
		);

		this.audioHandler.add(AUDIO_REVERSE, 2,
			[
				[2,,0.175,,0.4147,0.3131,,0.2175,,,,,,,,0.7216,,,1,,,,,0.2735]
			]
		);

		this.audioHandler.add(AUDIO_DEATH, 1,
			[
				//[3,0.0137,0.1196,0.0357,0.7666,0.5988,,-0.541,-0.0004,,,-0.7069,,-0.5796,-0.0053,0.8313,-0.1972,-0.7011,0.9901,0.3907,-0.1717,,0.5852,0.5]
				//[3,0.1405,0.01,0.3854,0.9984,0.0726,,,0.005,,0.1376,0.7791,0.8835,0.8931,-0.0015,0.383,-0.1131,-0.3126,0.4644,0.6286,0.1435,,0.1538,0.5]
				[3,,0.1943,0.6007,0.4404,0.5443,,-0.347,,,,,,,,0.3375,,,1,,,,,0.5]
			]
		);

		//this.audioHandler.addSequence( 'deathsong', new Sequencer({
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
		//		cymbal: this.audioHandler.instruments.cymbal,
		//		//drum: jsfxr([1,,0.1787,,0.3095,0.17,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
		//		//drum: jsfxr([1,,0.1417,,0.4065,0.2565,,,,,,,,,,,,,0.9934,0.2529,,0.1,,0.5]),
		//		bass: this.audioHandler.instruments.bass,
		//		drum: this.audioHandler.instruments.drum,
		//		wave: this.audioHandler.instruments.wave
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
		//this.audioHandler.playSequence('deathsong');

		this.lastUpdate = new Date().getTime();
		var tick = function() {

			self.ticks++;

			if ( self.state === Game.STATE_INIT ) {
				// do nothing
			} else if ( self.state === Game.STATE_MENU ) {

				self.handleInput();
				self.render();

			} else if ( self.state === Game.STATE_EDIT ) {

				self.handleInput();
				self.update();
				self.render();

			} else if ( self.state === Game.STATE_GAME ) {

				self.handleInput();
				self.update();
				self.render();

			} else if ( self.state === Game.STATE_WON ) {

				self.handleInput();
				self.render();

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

	Game[PROTO] = {
		setElementAtIndex: function(idx, el) {

			if ( this.elements.length <= idx || idx < 0 ) {
				return;
			}

			var rel = null;
			var posX = (idx%MAP_SIZE_X) * TILE_SIZE;
			var posY = parseInt(idx/MAP_SIZE_X, 10) * TILE_SIZE;

			if ( el === null ) {
				rel = null;
			} else if ( el instanceof Lava ) {
				rel = new Grass(this, posX, posY);
			} else if ( el instanceof Grass ) {
				rel = new Lava(this, posX, posY);
			} else if ( el instanceof Bomb ) {
				rel = new Ruby(this, posX, posY);
			} else if ( el instanceof Stone ) {
				rel = new Emerald(this, posX, posY);
			} else if ( el instanceof Ruby ) {
				rel = new Bomb(this, posX, posY);
			} else if ( el instanceof Emerald ) {
				rel = new Stone(this, posX, posY);
			} else if ( el instanceof Explosion ) {
				rel = new Explosion(this, posX, posY); // explosion are explosion
			} else if ( el instanceof Door ) {
				rel = new Door(this, posX, posY); // door are door
			}

			if ( this.isReversed ) {
				this.elements[idx] = rel;
				this.rElements[idx] = el;
			} else {
				this.elements[idx] = el;
				this.rElements[idx] = rel;
			}
		},
		deleteElementAtIndex: function(idx) {

			if ( this.elements.length <= idx || idx < 0 ) {
				return;
			}

			var el = this.elements[idx];
			// remove all dummies
			this.elements.forEach(function(item, i) {
				if ( item instanceof Dummy && item.ref === el ) {
					delete this.elements[i];
					this.setElementAtIndex(i, null);
				}
			}, this);
			var rEl = this.rElements[idx];
			// remove all dummies
			this.rElements.forEach(function(item, i) {
				if ( item instanceof Dummy && item.ref === rEl ) {
					delete this.rElements[i];
					var posX = (i%MAP_SIZE_X) * TILE_SIZE;
					var posY = parseInt(i/MAP_SIZE_X, 10) * TILE_SIZE;
					this.setElementAtIndex(i, new Grass(this, posX, posY));
				}
			}, this);

			delete this.elements[idx];
			//delete this.rElements[idx];
			this.setElementAtIndex(idx, null);
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
				self.messages.push(new Message(self, "Door was opened!!", 150));
				self.audioHandler.play(AUDIO_OPENDOOR);
			}

		},

		createElement: function( elementCode, x, y ) {
			var ret = null;
			switch ( elementCode ) {
				case ELEMENT_GRASS: ret = new Grass(this, x, y); break;
				case ELEMENT_STONE: ret = new Stone(this, x, y); break;
				case ELEMENT_BOMB: ret = new Bomb(this, x, y); break;
				case ELEMENT_EMERALD: ret = new Emerald(this, x, y); break;
				case ELEMENT_RUBY: ret = new Ruby(this, x, y); break;
				case ELEMENT_LAVA: ret = new Lava(this, x, y); break;
				case ELEMENT_DOOR: ret = new Door(this, x, y); break;
			}
			return ret;
		},

		drawBackground: function() {
			var self = this;
			self.context.fillStyle = '#000000';
			self.context.fillRect(0,0, self.canvas.width, self.canvas.height);

			if ( self.state === Game.STATE_EDIT ) {

				var gfx = new Gfx(self.sprite, 32, 80, TILE_SIZE, TILE_SIZE);

				//
				//self.renderStartX = self.player.x - VISIBLE_WIDTH*HALF_TILE_SIZE;
				//self.renderStartY = self.player.y - VISIBLE_WIDTH*HALF_TILE_SIZE;
				//if ( self.renderStartX < 0 ) {
				//	self.renderStartX = 0;
				//}
				//if ( self.renderStartY < 0 ) {
				//	self.renderStartY = 0;
				//}
				//if ( self.renderStartX+VISIBLE_WIDTH*TILE_SIZE > MAP_SIZE_X*TILE_SIZE ) {
				//	self.renderStartX = MAP_SIZE_X*TILE_SIZE - VISIBLE_WIDTH*TILE_SIZE;
				//}
				//if ( self.renderStartY+VISIBLE_HEIGHT*TILE_SIZE > MAP_SIZE_Y*TILE_SIZE ) {
				//	self.renderStartY = MAP_SIZE_Y*TILE_SIZE - VISIBLE_HEIGHT*TILE_SIZE;
				//}

				// draw grid lines
				self.context.strokeStyle = '#555';
				//var xOffset = 0;
				//var yOffset = 0;
				//if ( self.player.dirX > 0 ) xOffset = -self.player.substep*self.player.speed;
				//if ( self.player.dirX < 0 ) xOffset = self.player.substep*self.player.speed;
				//if ( self.player.dirY > 0 ) yOffset = -self.player.substep*self.player.speed;
				//if ( self.player.dirY < 0 ) yOffset = self.player.substep*self.player.speed;
				// draw with offset of the player!
				for ( var i = TILE_SIZE-self.renderStartX; i < self.canvas.width+self.renderStartX; i+=TILE_SIZE ) {
					self.context.beginPath();
					self.context.moveTo(i, 0);
					self.context.lineTo(i, self.canvas.height);
					self.context.stroke();
					self.context.closePath();
				}

				for ( var i = TILE_SIZE-self.renderStartY; i < self.canvas.height+self.renderStartY; i+=TILE_SIZE ) {
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


			if ( self.state === Game.STATE_MENU ) {
				if ( self.inputHandler.isPressed(VK_E) ) {
					// go to edit mode
					self.startEdit();

				} else if ( self.inputHandler.isPressed(VK_SPACE) ) {
					self.start();
				}

			} else if ( self.state === Game.STATE_EDIT ) {

				if ( self.inputHandler.isPressed(VK_SPACE) ) {
					self.editCurrentElement = self.editCurrentElement === self.allEditElements.length-1
						? 0
						: self.editCurrentElement+1;
				}

				if ( self.inputHandler.isDown(VK_E) ) {
					var pos = self.player.getActualPosition();
					console.log(pos.x, pos.y);
					self.setElementAtIndex(pos.y*MAP_SIZE_X+pos.x, self.createElement(self.editCurrentElement, pos.x*TILE_SIZE, pos.y*TILE_SIZE));
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

			} else if ( self.state === Game.STATE_GAME && self.player.substep === 0 ) {

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
			self.setElementAtIndex(y*MAP_SIZE_X+x, new Explosion(self, x*TILE_SIZE, y*TILE_SIZE));

		},

		createExplosion: function(px, py) {

			var self = this;

			// set desired place to explosion
			self.setElementAtIndex(py*MAP_SIZE_X+px, new Explosion(self, px*TILE_SIZE, py*TILE_SIZE));


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


		update: function() {
			var self = this;


			var currentTime = new Date().getTime();
			if ( currentTime - self.lastUpdate <= 1000/60 ) {
				return;
			}

			self.lastUpdate = currentTime;

			// update all elements ( they might start or stop falling )
			var playerPosBefore = self.player.getActualPosition();


			if ( self.state !== Game.STATE_EDIT ) {
				if ( self.player.substep === 0 ) {
					// when player is on the door, he won the game! :p
					var elAtPlayerPos = self.getElementAtPos(playerPosBefore.x, playerPosBefore.y);
					//console.log('Current pos: '+ playerPosBefore.x+'/'+playerPosBefore.y);
					if ( elAtPlayerPos instanceof Door ) {
						// won
						self.state = Game.STATE_WON;
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



			// then move the elements

			if ( self.state !== Game.STATE_EDIT ) {
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
						if ( elBelow === null
							&& ( !(playerPosBefore.x === pos.x && playerPosBefore.y === pos.y+1) || item.wasFalling )
						) {
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
								&& !(playerPosBefore.x === pos.x-1 && playerPosBefore.y === pos.y)
								&& !(playerPosBefore.x === pos.x-1 && playerPosBefore.y === pos.y+1)
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
									&& !(playerPosBefore.x === pos.x+1 && playerPosBefore.y === pos.y)
									&& !(playerPosBefore.x === pos.x+1 && playerPosBefore.y === pos.y+1)
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
			}

			if ( self.state !== Game.STATE_EDIT ) {
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
						self.state = Game.STATE_GAMEOVER;
						self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
						self.audioHandler.play(AUDIO_DEATH);
						//self.audioHandler.playSequence('deathsong');
						return;
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

					if ( self.state !== Game.STATE_EDIT ) {
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
					if ( self.state !== Game.STATE_EDIT ) {
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

			if ( self.state !== Game.STATE_EDIT ) {
				// player pos to index:
				var playerPosAfter = self.player.getActualPosition();

				var elIndex = playerPosAfter.y*MAP_SIZE_X+playerPosAfter.x;
				var elAtPlayer= self.getElementAtPos(playerPosAfter.x, playerPosAfter.y);
				if ( elAtPlayer === null ) {
				} else if ( elAtPlayer.isDeadly ) {

					// die!!!! :3
					self.state = Game.STATE_GAMEOVER;
					self.audioHandler.stopSequence(AUDIO_BG_MUSIC);
					self.audioHandler.play(AUDIO_DEATH);

				} else if ( elAtPlayer instanceof Grass ) {

					self.deleteElementAtIndex(elIndex);
					//console.log('ate some grass');

				} else if ( elAtPlayer instanceof Gem ) {

					self.player.gemCount+= elAtPlayer.value;
					self.deleteElementAtIndex(elIndex);
					if ( self.player.gemCount >= self.gemTarget ) {
						// open all doors
						self.openDoors();
					}
					//console.log('got an emerald');
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

		drawElements: function() {
			var self=  this;

			self.renderStartX = self.player.x - VISIBLE_WIDTH*HALF_TILE_SIZE;
			self.renderStartY = self.player.y - VISIBLE_WIDTH*HALF_TILE_SIZE;
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
				statusText = 'Game over...';
			} else if ( self.state === Game.STATE_WON ) {
				statusText = 'A winner is you!';
			} else if ( self.state === Game.STATE_GAME ) {
				statusText = 'Gems: '+ self.player.gemCount + '/' + self.gemTarget;
			} else if ( self.state === Game.STATE_EDIT ) {
				statusText = 'Edit Mode';
			}


			if ( self.state === Game.STATE_EDIT ) {
				var x = 340, y = VISIBLE_HEIGHT*TILE_SIZE + HALF_TILE_SIZE - HALF_FONT_SIZE;

				self.allEditElements.forEach(function(i) {

					if ( self.editCurrentElement === i ) {
						self.context.fillStyle = '#ff0000';
						self.context.fillRect(x-2,y-2, FONT_SIZE+4, FONT_SIZE+4);
					}

					if ( self.elementGraphics[i] ) {
						self.elementGraphics[i].render(self.context,x,y,undefined,undefined,FONT_SIZE);
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
			self.font.renderText(self.context, 'SPACE: Start Game', 50, 50);
			self.font.renderText(self.context, 'E:     Edit Map', 50, 50+FONT_SIZE+HALF_FONT_SIZE);
		},

		render: function() {
			var self = this;
			self.drawBackground();
			if ( self.state === Game.STATE_MENU ) {

				self.drawMenu();

			} else if ( self.state === Game.STATE_EDIT ) {

				self.drawElements();
				self.drawHud();
				self.player.render(self.context);

			} else {
				// render everything
				self.drawElements();
				self.drawHud();
				self.player.render(self.context);

			}
		},

		start: function() {


			this.startTime = new Date().getTime();
			this.messages.push(new Message(this, 'Welcome..', 300));
			this.messages.push(new Message(this, '...to the jungle..', 300));


			this.audioHandler.playSequence(AUDIO_BG_MUSIC);



			this.elements = [];
			this.rElements = [];

			this.gemCount = 0;

			var G = 'g';
			var S = 's';
			var R = 'r';
			var L = 'l';
			var E = 'e';
			var D = 'd';
			var B = 'b';
			var X = 'X';
			var map = [
				G,S,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,E,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,R,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,R,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,D,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,
				G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G
			];
			//map = false;

			if ( map ) {
				for ( var i = 0; i < map.length; i++ ) {
					this.elements.push(null);
					this.rElements.push(null);
				}
				var x, y;
				for ( var i = 0; i < map.length; i++ ) {
					var el = null;
					var rel = null;
					x = (i%MAP_SIZE_X) * TILE_SIZE;
					y = parseInt(i/MAP_SIZE_X, 10) * TILE_SIZE;
					switch ( map[i] ) {
						case G:
							this.setElementAtIndex(i, new Grass(this, x, y));
							break;
						case L:
							this.setElementAtIndex(i, new Lava(this, x, y));
							break;
						case B:
							this.setElementAtIndex(i, new Bomb(this, x, y));
							break;
						case S:
							this.setElementAtIndex(i, new Stone(this, x, y));
							break;
						case E:
							this.setElementAtIndex(i, new Emerald(this, x, y));
							break;
						case R:
							this.setElementAtIndex(i, new Ruby(this, x, y));
							break;
						case D:
							this.setElementAtIndex(i, new Door(this, x, y));
							break;
						default: break;
					}
				}
				this.gemTarget = this.gemCount;

			} else {

				for ( var i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
					this.elements.push(null);
					this.rElements.push(null);
				}

				var index = 0;
				var x, y;
				for ( var j = 0; j < MAP_SIZE_Y; j++ ) {
					for ( var i = 0; i < MAP_SIZE_X; i++ ) {

						var rnd = Rnd();
						x = i*TILE_SIZE;
						y = j*TILE_SIZE;

						if ( rnd > 0.99 ) {
							this.setElementAtIndex(index, new Ruby(this, x, y));
							//this.rElements.push(new Bomb(this, i*TILE_SIZE, j*TILE_SIZE));
						} else if ( rnd > 0.97 ) {
							this.setElementAtIndex(index, null);
							//this.rElements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
							//this.elements.push(null);
						} else if ( rnd > 0.9 ) {
							this.setElementAtIndex(index, new Bomb(this, x, y));
							//this.elements.push(new Bomb(this, i*TILE_SIZE, j*TILE_SIZE));
							//this.rElements.push(new Ruby(this, i*TILE_SIZE, j*TILE_SIZE));
						} else if ( rnd > 0.8 ) {
							this.setElementAtIndex(index, new Emerald(this, x, y));
							//this.elements.push(new Emerald(this, i*TILE_SIZE, j*TILE_SIZE));
							//this.rElements.push(new Stone(this, i*TILE_SIZE, j*TILE_SIZE));
						} else if ( rnd > 0.7 ) {
							this.setElementAtIndex(index, new Stone(this, x, y));
							//this.elements.push(new Stone(this, i*TILE_SIZE, j*TILE_SIZE));
							//this.rElements.push(new Emerald(this, i*TILE_SIZE, j*TILE_SIZE));
						} else if ( rnd > 0.35 ) {
							this.setElementAtIndex(index, new Grass(this, x, y));
							//this.elements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
							//this.rElements.push(null);
						} else {
							this.setElementAtIndex(index, new Lava(this, x, y));
						}
						index++;
					}
				}
				// generate a door at a random position
				var randX = Rnd()*MAP_SIZE_X | 0;
				var randY = Rnd()*MAP_SIZE_Y | 0;
				this.setElementAtIndex(randY*MAP_SIZE_X+randX, new Door(this, randX*TILE_SIZE, randY*TILE_SIZE));
				//console.log('door at : '+randX+'/'+randY);

				this.gemTarget = (this.gemCount * 0.75) | 0;

			}


			this.player = new Player(this, 0, 0);


			this.state = Game.STATE_GAME;
		},

		startEdit: function() {

			this.startTime = new Date().getTime();
			this.audioHandler.playSequence(AUDIO_BG_MUSIC);

			this.elements = [];
			this.rElements = [];

			this.gemCount = 0;

			for ( var i = 0; i < MAP_SIZE_Y*MAP_SIZE_X; i++ ) {
				this.elements.push(null);
				this.rElements.push(null);
			}

			this.player = new Player(this, 0, 0);


			this.editCurrentElement = ELEMENT_GRASS;
			this.state = Game.STATE_EDIT;

		},
		reset: function() {

		}
	};


	window.addEventListener('load', function() {
		new Game();
	});

})();