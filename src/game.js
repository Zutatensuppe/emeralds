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

	// some keys:
	const VK_LEFT = 37;
	const VK_RIGHT = 39;
	const VK_UP = 38;
	const VK_DOWN = 40;
	const VK_SPACE = 32;
	const VK_R = 82;
	const VK_M = 77;

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
			'567890/';
		this.sprite = sprite;
	}
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
			var _x = x;
			for ( var i = 0, iLen = text.length; i < iLen; i++ ) {
				var chr = text.charAt(i);
				if ( chr === "\n" ) {
					y+=16;
					_x = x;
					continue;
				}
				var posInSprite = this.posInSprite(chr);
				if ( posInSprite ) {
					this.sprite.render(screen, posInSprite.x, posInSprite.y, 8, 8, _x, y, FONT_SIZE, FONT_SIZE);
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

		this.keys = {};
		this.keys[VK_LEFT] = new VirtualKey();
		this.keys[VK_RIGHT] = new VirtualKey();
		this.keys[VK_UP] = new VirtualKey();
		this.keys[VK_DOWN] = new VirtualKey();
		this.keys[VK_SPACE] = new VirtualKey();
		this.keys[VK_R] = new VirtualKey();
		this.keys[VK_M] = new VirtualKey();

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

		this.instruments = {
			cymbal: jsfxr([3,,0.1787,,0.1095,0.502,,,,,,,,0.2868,,,,,1,,,0.1,,0.5]),
			drum: jsfxr([3,,0.1787,,0.1095,0.17,,-0.58,,,,,,0.2868,,,,,1,,,0.1,,0.5]),
			bass: jsfxr([0,,0.1897,0.2618,1,0.12,,0.02,,,,,,0.4812,-0.1783,,,,1,,,0.132,,0.5]),
			wave: jsfxr([0,0,0.037985307862982154,0.5060126532800495,0.4385391124524176,0.5989582167007029,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0.4]),
			beep: jsfxr([0,0,0.037985307862982154,0.5060126532800495,0.4385391124524176,0.5989582167007029,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0.2])
		};
		//this.soundFx = new SoundFx(new AudioContext());
	}
	AudioHandler.prototype = {

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
			var rand = sound.length > 1 ? Math.floor(Math.random()*sound.length) : 0;
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
	}
	Entity.prototype = {
		constructor: Entity.prototype.constructor,
		getActualPosition: function() {
			return {x: Math.round(this.x/TILE_SIZE, 10), y: Math.round(this.y/TILE_SIZE, 10)};
		},
		move: function() {
			this.x = this.x+this.dirX*this.speed;
			this.y = this.y+this.dirY*this.speed;
		},
		unmove: function() {
			this.x = this.x-this.dirX*this.speed;
			this.y = this.y-this.dirY*this.speed;
		},
		render: function(context) {
			this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		}
	};


	/* The Player
	===============================================================*/
	function Player(g, x, y) {
		Entity.prototype.constructor.call(this, g, null, x, y, TILE_SIZE, TILE_SIZE);
		this.speed = OBJECT_SPEED;
		this.stepsPerTile = TILE_SIZE/this.speed;
		this.substep = 0; // max TILE_SIZE/this.speed
		this.gemCount = 0;

		this.gfx = new Gfx(g.sprite, 16, 16, 16, 16);
		this.gfxRight = [new Gfx(g.sprite, 32, 16, 16, 16), new Gfx(g.sprite, 16, 32, 16, 16)];
		this.gfxLeft = [new Gfx(g.sprite, 0, 32, 16, 16), new Gfx(g.sprite, 0, 48, 16, 16)];
		this.gfxUpDown = [new Gfx(g.sprite, 16, 48, 16, 16), new Gfx(g.sprite, 16, 64, 16, 16)];

	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.constructor = Player;
	Player.prototype.render = function(context) {

		var screenX = this.x - this.game.renderStartX;
		var screenY = this.y - this.game.renderStartY;

		if (  this.game.state === 'game' ) {
			var frame = this.game.ticks % 24 < 12 ? 1 : 0;
			if ( this.dirX < 0 ) {
				this.gfxLeft[frame].render(context, screenX, screenY);
			} else if ( this.dirX > 0 ) {
				this.gfxRight[frame].render(context, screenX, screenY);
			} else if ( this.dirY != 0 ) {
				this.gfxUpDown[frame].render(context, screenX, screenY);
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


	/* Gem
	 ===============================================================*/
	function Gem(g, gfx, x, y, w, h) {
		Entity.prototype.constructor.call(this, g, gfx, x, y, w, h);
		this.isWalkable = true;
		this.value = 0;
		this.collectSound = '';
	}
	Gem.prototype = Object.create(Entity.prototype);
	Gem.prototype.constructor = Gem;
	Gem.prototype.playCollectSound = function() {
		this.game.audioHandler.play(this.collectSound);
		this.game.audioHandler.playSequence(this.collectSound);
	};

	/* Emerald
	 ===============================================================*/
	function Emerald(g, x, y){
		Gem.prototype.constructor.call(this, g, new Gfx(g.sprite, 0, 16, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.value = 1;
		this.collectSound = 'emerald';
		g.gemCount+=this.value;

		// emerald sound
		if ( !g.audioHandler.has('emerald') ) {
			g.audioHandler.add( 'emerald', 5,
				[
					[0,,0.0881,0.4996,0.2593,0.8492,,,,,,0.2308,0.6901,,,,,,1,,,,,0.5]
				]
			);
		}


	}
	Emerald.prototype = Object.create(Gem.prototype);
	Emerald.prototype.constructor = Emerald;

	/* Ruby
	 ===============================================================*/
	function Ruby(g, x, y){
		Gem.prototype.constructor.call(this, g, new Gfx(g.sprite, 0, 64, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.value = 5;
		this.collectSound = 'ruby';
		g.gemCount+=this.value;

		// ruby sound
		if ( !g.audioHandler.hasSequence('ruby') ) {
			g.audioHandler.addSequence( 'ruby', new Sequencer({
				loopSpeed: 100,
				instruments: g.audioHandler.instruments,
				loops: [],
				song: [
					[{n:'beep',p:1.24}],
					[{n:'beep',p:1.3}],
					[{n:'beep',p:1.6}]
				],
				loop: false
			}));
		}
	}
	Ruby.prototype = Object.create(Gem.prototype);
	Ruby.prototype.constructor = Ruby;

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

	/* Door
	===================================================================*/
	function Door(g, x, y) {
		Entity.prototype.constructor.call(this, g, null, x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = false;
		this.isOpen = false;
		this.stepsPerTile = TILE_SIZE/OBJECT_SPEED;

		this.gfx = new Gfx(g.sprite, 32, 32, 16, 16);
		this.gfxOpen = [new Gfx(this.game.sprite, 32, 48, 16, 16), new Gfx(this.game.sprite, 32, 64, 16, 16)];
	}
	Door.prototype = Object.create(Entity.prototype);
	Door.prototype.constructor = Door;
	Door.prototype.open = function() {
		this.isOpen = true;
		this.isWalkable = true;
	};
	Door.prototype.render = function(context) {
		if ( this.game.state === 'game' && this.isOpen ) {
			var frame = this.game.ticks % 32 < 16 ? 1 : 0;
			//this.frame = ( this.substep > this.stepsPerTile / 2 ) ? 1 : 0;
			this.gfxOpen[frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else {
			this.gfx.render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		}
	};




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
		this.ticks = 0;

		this.renderStartX = 0;
		this.renderStartY = 0;

		//self.canvas.width  = 1024; //window.innerWidth;
		//self.canvas.height = 768; //window.innerHeight;

		this.isReversed = false;
		this.isMuted = false;

		this.inputHandler = new InputHandler();
		this.state = 'init';
		this.sprite = new Sprite('sprites.png', function() {
			self.state = 'game';
			self.font = new Font(self.sprite);
			self.init();
		}); // load sprite


		this.audioHandler = new AudioHandler();

		// Milliseconds per beat.
		var loopSpeed = 250;
		// Predefined loops. Saves duplication in the song.
		var loops = {
			drumloop: [
				[],
				[],
				['cymbal'],
				[]
			]
		};
		// The song! Put instruments/loops in here.
		var song = [
			['drumloop', 'wave'],
			[{n:'wave',p:1.06}],
			[],
			[{n:'wave',p:1.06}],
			['drumloop', {n:'wave', p: 1}],
			[],
			[],
			[{n:'wave',p:1.24}],
			['drumloop'],
			[{n:'wave',p:1.3}],
			[],
			[],
			['drumloop', 'bass'],
			[],
			[],
			[],
			['drumloop', 'bass'],
			[],
			[],
			[],
			['drumloop'],
			[{n:'wave',p:0.88}],
			[{n:'wave',p:0.94}],
			[],
			['drumloop'],
			[{n:'wave',p:0.94}],
			[{n:'wave',p:0.88}],
			[],
			['drumloop'],
			[],
			[],
			[],
			['drumloop', 'bass'],
			[],
			[],
			[],
			['drumloop', 'bass'],
			[],
			[],
			[],
			['drumloop'],
			[],
			[],
			[]
		];

		// Fire up a sequencer with all of the above
		this.audioHandler.addSequence('backgroundmusic', new Sequencer({
			loopSpeed: loopSpeed, // milliseconds per beat
			instruments: this.audioHandler.instruments, // The Audio elements
			loops: loops, // Loops
			song: song, // The actual song
			loop: true, // Loop over and over
			buffer: 1.4 // seconds buffer. ~min Chrome lets us have in a background tab
		}));
		this.audioHandler.playSequence('backgroundmusic');

		// emerald sound
		this.audioHandler.add( 'explosion', 5,
			[
				[3,,0.131,0.5546,0.4945,0.1142,,,,,,,,,,0.6184,-0.1018,-0.1237,1,,,,,0.5]

			]
		);
		// open door
		this.audioHandler.add('opendoor', 1,
			[
				[1,,0.2125,,0.4813,0.4889,,0.2423,,,,,,,,0.7641,,,1,,,,,0.4935]
			]
		);

		// stone falls to the ground
		this.audioHandler.add('stone', 5,
			[
				[3,,0.1535,0.2135,0.0535,0.0535,,-0.2463,,,,,,,,,0.0328,-0.1877,0.8134,,,,,0.4935]
			]
		);

		this.audioHandler.add('walk', 1,
			[
				//[10, 0, 0.1, "sine", 0.2, 0, 0, 40, false, 0, 20,,]
				[3,,0.1017,0.0535,0.0782,0.0735,,-0.536,,,,,,,,,,,1,,,0.0436,,0.2735],
			]
		);

		this.audioHandler.add('reverse', 2,
			[
				[2,,0.175,,0.4147,0.3131,,0.2175,,,,,,,,0.7216,,,1,,,,,0.2735]
			]
		);


		this.elements = [];
		this.rElements = [];

		this.gemCount = 0;

		var map = [
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','e','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','d','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'
		];
		map = false;

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
					case 'g':
						this.setElementAtIndex(i, new Grass(this, x, y));
						break;
					case 'b':
						this.setElementAtIndex(i, new Bomb(this, x, y));
						break;
					case 's':
						this.setElementAtIndex(i, new Stone(this, x, y));
						break;
					case 'e':
						this.setElementAtIndex(i, new Emerald(this, x, y));
						break;
					case 'r':
						this.setElementAtIndex(i, new Ruby(this, x, y));
						break;
					case 'd':
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

					var rnd = Math.random();
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
					} else {
						this.setElementAtIndex(index, new Grass(this, x, y));
						//this.elements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
						//this.rElements.push(null);
					}
					index++;
				}
			}
			// generate a door at a random position
			var randX = Math.random()*MAP_SIZE_X | 0;
			var randY = Math.random()*MAP_SIZE_Y | 0;
			this.setElementAtIndex(randY*MAP_SIZE_X+randX, new Door(this, randX*TILE_SIZE, randY*TILE_SIZE));
			//console.log('door at : '+randX+'/'+randY);

			this.gemTarget = (this.gemCount * 0.75) | 0;

		}

		this.player = new Player(this, 0, 0);

		this.lastUpdate = new Date().getTime();
		var tick = function() {

			self.ticks++;

			if ( self.state === 'init' ) {
				// do nothing
			} else if ( self.state ==='game' ) {

				self.handleInput();
				self.update();
				self.render();
			} else if ( self.state === 'won' ) {
				self.handleInput();
				self.render();
			}

			requestAnimationFrame(tick);
		};

		tick();

	}
	Game.prototype = {
		setElementAtIndex: function(idx, el) {

			if ( this.elements.length <= idx || idx < 0 ) {
				return;
			}

			var rel = null;
			var posX = (idx%MAP_SIZE_X) * TILE_SIZE;
			var posY = parseInt(idx/MAP_SIZE_X, 10) * TILE_SIZE;

			if ( el === null ) {
				rel = new Grass(this, posX, posY);
			} else if ( el instanceof Grass ) {
				rel = null;
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
				self.audioHandler.play('opendoor');
			}

		},

		drawBackground: function() {
			var self = this;
			self.context.fillRect(0,0, self.canvas.width, self.canvas.height);
		},
		handleInput: function(){
			var self = this;

			self.inputHandler.tick();

			if ( self.state === 'game' && self.player.substep === 0 ) {

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
					self.audioHandler.play('reverse');
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

			if ( typeof el === 'undefined' ) {
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

			self.audioHandler.play('explosion');
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


			if ( self.player.substep === 0 ) {
				// when player is on the door, he won the game! :p
				var elAtPlayerPos = self.getElementAtPos(playerPosBefore.x, playerPosBefore.y);
				//console.log('Current pos: '+ playerPosBefore.x+'/'+playerPosBefore.y);
				if ( elAtPlayerPos instanceof Door ) {
					// won
					self.state = 'won';
					self.player.dirX = 0;
					self.player.dirY = 0;
					self.audioHandler.stopSequence('backgroundmusic');
					return;
				}
			}


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
							self.setElementAtIndex((pos.y+1)*MAP_SIZE_X+pos.x, new Dummy(item)); // item will fall there eventually!
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
								self.setElementAtIndex((pos.y)*MAP_SIZE_X+(pos.x-1), new Dummy(item)); // item will fall there eventually!
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
									self.setElementAtIndex((pos.y)*MAP_SIZE_X+(pos.x+1), new Dummy(item)); // item will fall there eventually!
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
						self.audioHandler.play('stone');
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



			var playerHasMoved = false;

			// check if at the position is something and that something is not already moving
			if ( self.player.dirX !== 0 || self.player.dirY !== 0 ) {
				self.player.move();
				playerHasMoved = true;

				// player moves each field in 8 steps
				self.player.substep = self.player.substep < self.player.stepsPerTile-1 ? self.player.substep+1 : 0;
			}

			var unmove = false;
			if ( self.player.substep === 1 ) {


				// player started moving. lets see if he hits the bounds of the map, if yes, then unmove and set substep to 0;
				if ( self.player.x <= 0 && self.player.dirX < 0 ) {
					unmove = true;
				} else if ( self.player.x >= (MAP_SIZE_X-1)*TILE_SIZE && self.player.dirX > 0 ) {
					unmove = true;
				} else if ( self.player.y <= 0 && self.player.dirY < 0 ) {
					unmove = true;
				} else if ( self.player.y >= (MAP_SIZE_Y-1)*TILE_SIZE && self.player.dirY > 0 ) {
					unmove = true;
				} else if ( self.player.dirX !== 0 ) {
					// check left right elements if player can move there
					// moving horizontally
					var nextEl= self.getElementAtPos(playerPosBefore.x+self.player.dirX, playerPosBefore.y);
					var nextNextEl = self.getElementAtPos(playerPosBefore.x+self.player.dirX+self.player.dirX, playerPosBefore.y);

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
					// check top/bottom elements
					// moving vertically

					var nextEl= self.getElementAtPos(playerPosBefore.x, playerPosBefore.y+self.player.dirY);
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

			}

			if ( unmove ) {
				// just dont move..
				self.player.unmove();
				self.player.substep = 0;
				playerHasMoved = false;
			}


			if ( playerHasMoved ) {
				self.audioHandler.play('walk');
			}

			// player pos to index:
			var playerPosAfter = self.player.getActualPosition();

			var elIndex = playerPosAfter.y*MAP_SIZE_X+playerPosAfter.x;
			var elAtPlayer= self.getElementAtPos(playerPosAfter.x, playerPosAfter.y);
			if ( elAtPlayer instanceof Grass ) {

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

			var elementsToRender = self.isReversed ? self.rElements : self.elements;
			elementsToRender.forEach(function(item) {
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

				item.render(self.context);

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

			if ( self.state === 'won' ) {
				self.font.renderText(
					self.context,
					'A winner is you!',
					FONT_SIZE/2,
					(VISIBLE_HEIGHT)*TILE_SIZE + (TILE_SIZE/2 - FONT_SIZE/2)
				);
			} else {
				self.font.renderText(
					self.context,
					"Gems: "+ self.player.gemCount + '/' + self.gemTarget,
					FONT_SIZE/2,
					(VISIBLE_HEIGHT)*TILE_SIZE + (TILE_SIZE/2 - FONT_SIZE/2)
				);
			}
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