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
			'567890/';
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
		this.KEYS = { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32, R: 82 };

		this.keys = {};
		this.keys[this.KEYS.LEFT] = new VirtualKey();
		this.keys[this.KEYS.RIGHT] = new VirtualKey();
		this.keys[this.KEYS.UP] = new VirtualKey();
		this.keys[this.KEYS.DOWN] = new VirtualKey();
		this.keys[this.KEYS.SPACE] = new VirtualKey();
		this.keys[this.KEYS.R] = new VirtualKey();

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
		}
	};


	/////////////////////////////////////////////////////////////////
	// Audio
	/////////////////////////////////////////////////////////////////
	function AudioHandler() {
		this.sounds = {};
	}
	AudioHandler.prototype = {
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
			soundSettings.forEach(function(item, idx, arr) {
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
				}
			}, this);
		},
		play: function(key) {
			// fetch the sound for the key
			var sound = this.sounds[key];

			// get one of the sounds for the specified key randomly
			var rand = sound.length > 1 ? Math.floor(Math.random()*sound.length) : 0;
			//console.log('playing sound "'+key+'", variant '+rand);
			var soundData = sound[rand];

			// play the sound
			soundData.pool[soundData.current].play();

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
		this.emeraldCount = 0;

		this.gfx = new Gfx(g.sprite, 16, 16, 16, 16);
		this.gfxRight = [new Gfx(g.sprite, 32, 16, 16, 16), new Gfx(g.sprite, 16, 32, 16, 16)];
		this.gfxLeft = [new Gfx(g.sprite, 0, 32, 16, 16), new Gfx(g.sprite, 0, 48, 16, 16)];
		this.gfxUpDown = [new Gfx(g.sprite, 16, 48, 16, 16), new Gfx(g.sprite, 16, 64, 16, 16)];

		this.frame = 0;
	}
	Player.prototype = Object.create(Entity.prototype);
	Player.prototype.constructor = Player;
	Player.prototype.render = function(context) {

		if ( this.substep >= this.stepsPerTile - 2 ) {
			this.frame = 1;
		} else if (this.substep >= this.stepsPerTile - 4 ) {
			this.frame = 1;
		} else if (this.substep >= this.stepsPerTile - 6 ) {
			this.frame = 0;
		} else if (this.substep >= this.stepsPerTile - 8 ) {
			this.frame = 0;
		}
		if ( this.dirX < 0 ) {
			this.gfxLeft[this.frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else if ( this.dirX > 0 ) {
			this.gfxRight[this.frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
		} else if ( this.dirY != 0 ) {
		//console.log(this.frame);
			this.gfxUpDown[this.frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
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

	/* Ruby
	 ===============================================================*/
	function Ruby(g, x, y){
		Entity.prototype.constructor.call(this, g, new Gfx(g.sprite, 0, 64, 16, 16), x, y, TILE_SIZE, TILE_SIZE);
		this.isWalkable = true;
	}
	Ruby.prototype = Object.create(Entity.prototype);
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
		this.frame = ( this.substep > this.stepsPerTile / 2 ) ? 1 : 0;
		if ( this.isOpen ) {
			this.gfxOpen[this.frame].render(context, this.x - this.game.renderStartX, this.y - this.game.renderStartY);
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


		this.audioHandler = new AudioHandler();

		/*
		* Sound Arguments are:
		* ====================================================
		*                a: waveType
		*                b: attackTime
		*                c: sustainTime
		*                d: sustainPunch
		*                e: decayTime
		*                f: startFrequency
		*                g: minFrequency
		*                h: slide
		*                i: deltaSlide
		*                j: vibratoDepth
		*                k: vibratoSpeed
		*                l: changeAmount
		*                m: changeSpeed
		*                n: squareDuty
		*                o: dutySweep
		*                p: repeatSpeed
		*                q: phaserOffset
		*                r: phaserSweep
		*                s: lpFilterCutoff
		*                t: lpFilterCutoffSweep
		*                u: lpFilterResonance
		*                v: hpFilterCutoff
		*                w: hpFilterCutoffSweep
		*                x: masterVolume
		*/

		// emerald sound
		this.audioHandler.add( 'emerald', 5,
			[
				[0,,0.01,0.4394,0.3103,0.8765,,,,,,0.3614,0.5278,,,,,,1,,,,,0.5]
				//[1,,0.01,0.4394,0.3103,0.8765,,,,,,0.3614,0.5278,,,,,,1,,,,,0.5],
				//[2,,0.01,0.4394,0.3103,0.8765,,,,,,0.3614,0.5278,,,,,,1,,,,,0.5],
				//[3,,0.01,0.4394,0.3103,0.8765,,,,,,0.3614,0.5278,,,,,,1,,,,,0.5]
			]
		);
		// emerald sound
		this.audioHandler.add( 'explosion', 5,
			[
				[3,,0.131,0.5546,0.4945,0.1142,,,,,,,,,,0.6184,-0.1018,-0.1237,1,,,,,0.5]
			]
		);

		this.audioHandler.add('walk', 1,
			[
				[3,,0.1017,0.0535,0.0782,0.0735,,-0.536,,,,,,,,,,,1,,,0.0436,,0.1735],
				//[2,,0.1257,0.1265,0.0542,0.1935,0.0535,-0.933,-0.493,0.0735,0.2135,-0.547,0.1735,0.0379,0.0015,0.1065,-0.773,0.453,0.2535,-0.667,0.8865,0.0665,-0.813,0.29]
				//[2,,0.1396,0.2205,0.0403,0.2718,0.0664,-0.6762,0.08,0.0374,0.0259,-0.0392,,0.0379,0.0015,0.0231,-0.0831,0.037,0.9115,-0.0838,0.0382,0.0236,-0.0658,0.29]
			]
		);

		this.audioHandler.add('reverse', 2,
			[
				[2,,0.175,,0.4147,0.3131,,0.2175,,,,,,,,0.7216,,,1,,,,,0.1735]
				//[3,0.0323,0.2485,0.0299,0.283,0.3206,0.05,0.5595,0.0932,,0.0268,-0.0745,,0.0952,-0.0565,0.7068,-0.068,0.0111,0.964,-0.0807,0.07,0.0512,0.1103,0.1735]
			]
		);


		this.pendingExplodePositions = [];
		this.elements = [];
		this.rElements = [];
		this.isReversed = false;

		this.emeraldCount = 0;

		var map = [
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','b','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','r','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','s','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','s','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','X','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g',
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
			'g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'
		];
		map = false;

		if ( map ) {
			for ( var i = 0; i < map.length; i++ ) {
				var el = null;
				var rel = null;
				var posX = (i%MAP_SIZE_X) * TILE_SIZE;
				var posY = parseInt(i/MAP_SIZE_X, 10) * TILE_SIZE;
				switch ( map[i] ) {
					case 'g':
						el = new Grass(this, posX, posY);
						rel = null;
						break;
					case 'b':
						el = new Bomb(this, posX, posY);
						rel = new Ruby(this, posX, posY);
						this.emeraldCount+=5;
						break;
					case 's':
						el = new Stone(this, posX, posY);
						rel = new Emerald(this, posX, posY);
						this.emeraldCount++;
						break;
					case 'e':
						el = new Emerald(this, posX, posY);
						rel = new Stone(this,posX, posY);
						this.emeraldCount++;
						break;
					case 'r':
						el = new Ruby(this, posX, posY);
						rel = new Bomb(this,posX, posY);
						this.emeraldCount+=5;
						break;
					case 'd':
						el = new Door(this, posX, posY);
						rel = new Door(this,posX, posY);
						break;
					default: break;
				}
				this.elements[i] = el;
				this.rElements[i] = rel;
			}
			this.emeraldTarget = this.emeraldCount;

		} else {

			for ( var j = 0; j < MAP_SIZE_Y; j++ ) {
				for ( var i = 0; i < MAP_SIZE_X; i++ ) {
					var rnd = Math.random();

					//todo: add reverses
					if ( rnd > 0.99 ) {
						this.elements.push(new Ruby(this, i*TILE_SIZE, j*TILE_SIZE));
						this.emeraldCount+=5;
						this.rElements.push(new Bomb(this, i*TILE_SIZE, j*TILE_SIZE));
					} else if ( rnd > 0.97 ) {
						this.rElements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
						this.elements.push(null);
					} else if ( rnd > 0.9 ) {
						this.elements.push(new Bomb(this, i*TILE_SIZE, j*TILE_SIZE));
						this.rElements.push(new Ruby(this, i*TILE_SIZE, j*TILE_SIZE));
						this.emeraldCount+=5;
					} else if ( rnd > 0.8 ) {
						this.elements.push(new Emerald(this, i*TILE_SIZE, j*TILE_SIZE));
						this.rElements.push(new Stone(this, i*TILE_SIZE, j*TILE_SIZE));
						this.emeraldCount++;
					} else if ( rnd > 0.7 ) {
						this.elements.push(new Stone(this, i*TILE_SIZE, j*TILE_SIZE));
						this.rElements.push(new Emerald(this, i*TILE_SIZE, j*TILE_SIZE));
						this.emeraldCount++;
					} else {
						this.elements.push(new Grass(this, i*TILE_SIZE, j*TILE_SIZE));
						this.rElements.push(null);
					}
				}
			}
			// generate a door at a random position
			var randX = Math.random()*MAP_SIZE_X | 0;
			var randY = Math.random()*MAP_SIZE_Y | 0;
			this.setElementAtIndex(randY*MAP_SIZE_X+randX, new Door(this, randX*TILE_SIZE, randY*TILE_SIZE));
			//console.log('door at : '+randX+'/'+randY);

			this.emeraldTarget = (this.emeraldCount * 0.75) | 0;

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
			} else if ( self.state === 'won' ) {
				self.render();
			}

			requestAnimationFrame(tick);
		};

		tick();

	}
	Game.prototype = {
		setElementAtIndex: function(idx, el) {

			if ( this.elements.length > idx && idx >= 0 ) {

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
			}
		},
		deleteElementAtIndex: function(idx) {
			if ( this.elements.length > idx && idx >= 0 ) {

				var el = this.elements[idx];
				// remove all dummies
				this.elements.forEach(function(item, i, arr) {
					if ( item instanceof Dummy && item.ref === el ) {
						delete this.elements[i];
						this.setElementAtIndex(i, null);
					}
				}, this);
				var rEl = this.rElements[idx];
				// remove all dummies
				this.rElements.forEach(function(item, i, arr) {
					if ( item instanceof Dummy && item.ref === el ) {
						delete this.rElements[i];
						var posX = (i%MAP_SIZE_X) * TILE_SIZE;
						var posY = parseInt(i/MAP_SIZE_X, 10) * TILE_SIZE;
						this.setElementAtIndex(i, new Grass(this, posX, posY));
					}
				}, this);

				delete this.elements[idx];
				//delete this.rElements[idx];
				this.setElementAtIndex(idx, null);
			}
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
			self.elements.forEach(function(item, idx, arr) {
				if ( item instanceof Door ) {
					item.open();
				}
			});
			self.rElements.forEach(function(item, idx, arr) {
				if ( item instanceof Door ) {
					item.open();
				}
			});

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

			if ( self.inputHandler.keys[self.inputHandler.KEYS.R].isPressed ) {
				if ( self.player.substep === 0 ) {
					self.isReversed = !self.isReversed;
					self.audioHandler.play('reverse');
				}
			}

		},

		maybeCreateExplosion: function(px, py) {


			var self = this;

			// check if we hit a bomb, if yes, explode them too
			//var elIndex = y*MAP_SIZE_X+x;

			var el = self.getElementAtPos(px,py);

			if ( typeof el === 'undefined' ) {
				return;
			}
			// if there is already an explosion, continue
			if ( el instanceof Explosion ) {
				return;
			}

			// if a dummy, then look inside
			if ( el instanceof Dummy ) {
				var innerEl = el.ref;
				if ( innerEl instanceof Explosion ) {
					// should not happen, but if, then continue
					return;
				}

				// if there is a bomb, then create an explosion at the position where the thing will be falling to
				if ( innerEl instanceof Bomb ) {
					self.createExplosion(px, py);
				} else {

					if ( innerEl !== null ) {
						// delete original element
						var pos = innerEl.getActualPosition();
						self.deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
					}
				}

			} else {

				// it is not a dummy

				// if there is a bomb, then create an explosion at the position where the thing will be falling to
				if ( el instanceof Bomb ) {

					self.createExplosion(px, py);
				} else {

					if ( el !== null ) {
						// delete original element
						var pos = el.getActualPosition();
						self.deleteElementAtIndex(pos.y*MAP_SIZE_X+pos.x);
					}
				}

			}


			// add explosion entity at the place
			self.setElementAtIndex(py*MAP_SIZE_X+px, new Explosion(self, px*TILE_SIZE, py*TILE_SIZE));

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
					return;
				}
			}


			var elementsToUpdate = self.isReversed ? self.rElements : self.elements;
			elementsToUpdate.forEach(function(item, idx, arr) {
				if ( item === null ) {
					return;
				}

				if ( item instanceof Door ) {
					if ( item.substep >= item.stepsPerTile ) {
						item.substep = 0;
					} else {
						item.substep++;
					}
				}
				if ( item instanceof Explosion ) {
					item.ticktick--;
					if ( item.ticktick === 0 ) {
						self.deleteElementAtIndex(idx);
						return;
					}
				}
				var pos = item.getActualPosition();
				if ( item instanceof Stone || item instanceof Bomb ) {
					// get element below the stone:
					var elBelow = self.getElementAtPos(pos.x, pos.y+1);
					if ( elBelow === null
						&& item.substep === 0
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

					} else if ( (elBelow instanceof Stone || elBelow instanceof Bomb)  && item.substep === 0 && !item.isFalling ) {

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
					var pos = item.getActualPosition();
					self.createExplosion(pos.x,pos.y);
				}
				if (item.wasFalling) {
					item.wasFalling = false;
				}
			});

			elementsToUpdate.forEach(function(item, idx, arr) {
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
					var pos = item.getActualPosition();
					var elIdx = pos.y*MAP_SIZE_X+pos.x;

					self.deleteElementAtIndex(idx);
					self.setElementAtIndex(elIdx, item);

				}
			});



			var playerHasMoved = false;

			// check if at the position is something and that something is not already moving
			if ( self.player.dirX !== 0 || self.player.dirY !== 0 ) {
				self.player.move();
				playerHasMoved = true;

				// player moves each field in 8 steps
				self.player.substep++;
				if ( self.player.substep >= self.player.stepsPerTile ) {
					self.player.substep = 0;
				}
			}

			// player started moving. lets see if he hits the bounds of the map, if yes, then unmove and set substep to 0;
			if ( self.player.substep === 1 ) {

				var unmove = false;
				if ( self.player.x <= 0 && self.player.dirX < 0 ) {
					unmove = true;
				}
				if ( self.player.x >= (MAP_SIZE_X-1)*TILE_SIZE && self.player.dirX > 0 ) {
					unmove = true;
				}
				if ( self.player.y <= 0 && self.player.dirY < 0 ) {
					unmove = true;
				}
				if ( self.player.y >= (MAP_SIZE_Y-1)*TILE_SIZE && self.player.dirY > 0 ) {
					unmove = true;
				}

				if ( unmove ) {
					// just dont move..
					self.player.unmove();
					self.player.substep = 0;
					playerHasMoved = false;
				}

			}

			// player started moving. check if some other elements must move and check if the player can even move!
			if ( self.player.substep === 1 ) {

				var unmove = false;
				if ( self.player.dirX !== 0 ) {
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


				if ( unmove ) {
					// just dont move..
					self.player.unmove();
					self.player.substep = 0;
					playerHasMoved = false;
				}
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
			} else
			// todo : refactor so that emeralds and ruby act the same, only give different points
			if ( elAtPlayer instanceof Emerald ) {

				self.deleteElementAtIndex(elIndex);
				self.player.emeraldCount++;
				if ( self.player.emeraldCount >= self.emeraldTarget ) {
					// open all doors
					self.openDoors();
				}
				//console.log('got an emerald');

				self.audioHandler.play('emerald');

			} else if ( elAtPlayer instanceof Ruby ) {

				self.deleteElementAtIndex(elIndex);
				self.player.emeraldCount+=5;
				if ( self.player.emeraldCount >= self.emeraldTarget ) {
					// open all doors
					self.openDoors();
				}
				//console.log('got a ruby!');

				self.audioHandler.play('emerald');

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
			elementsToRender.forEach(function(item, idx, arr) {
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
					"Emeralds: "+ self.player.emeraldCount + '/' + self.emeraldTarget,
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