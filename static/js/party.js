function Party() {
	this.translation_tpl=  $('#translation_tpl').html();
	this.quip_tpl=  $('#quip_tpl').html();
	this.$results = $('#results');
	this.$translator = $('#translator');
	this.phrase_queue = [];
	this.last_displayed_phrase = 0;
	this.party_status = 'partying';
	this.id = null;
}

Party.prototype = {
	
	quip_types: [{
		'type': 'uppercase',
		'match': /^[A-Z\s.\?\!]+$/,
		'quips': ["But it's not nice to shout.", "Ayy lmao"]
	}, {
		'type': 'dirty',
		'match': /(fuck|shit|ass|tit|bitch|screw|dick|pussy|nuts|balls)/i,
		'quips': ["Would you talk to your mouth with that mother.", "Ayy lmao"]
	}, {
		'type': 'meme',
		'match': /(all your base|i can ha[sz]+|never gonna|all the)/i,
		'quips': ["You're sure are up on your Internet jokes!", "That Internet joke is funny in any language!"]
	}, {
		'type': 'tp',
		'match': /(translation|party|who made|who built|\bwill\b|carlough|rick|richard|boenigk)/i,
		'quips': ["Translation Party was made by Will Carlough and Richard Boenigk. Send us an email at <a href='mailto: translationparty@gmail.com'>translationparty@gmail.com</a>"]
	}, {
		'type': 'multipurpose',
		'match': /.*/,
		'quips': ["This is a real translation party!", "You should move to Japan!", "You've done this before, haven't you.", "Okay, I get it, you like Translation Party.", "That's deep, man.", "Come on, you can do better than that.", "That didn't even make that much sense in English.", "Translation Party is hiring, you know."]
	}],


	// translating side
	translate_last_phrase: function() {
		var phrase = this.phrase_queue[this.phrase_queue.length - 1];
		var outLang = (phrase.lang == 'en') ? 'ja' : 'en';
		var self = this;

		var translation_success = function(result) {
			self.handle_translation_response(result, outLang);
		}

		var translation_fail = function(result) {
			alert("Problem with Yandex, probably over limit");
		}

		$.ajax({
			url: "/translate",
			data: {
				text: phrase.string,
				from: phrase.lang,
				to: outLang
			},
			success: translation_success,
			error: translation_fail
		});
	},

	handle_translation_response: function(translatedText, outLang) {
		this.phrase_queue.push({
			'lang': outLang,
			'string': translatedText
		});
		this.check_party_progress();
	},

	add_card: function( $card, callback) {
		$card.appendTo( this.$results ).hide();
		var z = this.$results.find('.card').length * -1;
		$card.css( { 'z-index': z } );
		var self = this;
		var callback = callback || function() {};
		setTimeout(function() {
			$card.show();
			$card.transition({
				y: -1 * CARD_HEIGHT
			}, 0);
			$card.transition({
				y: 0
			}, 200, function() {
				callback();
			});
		}, 0);
	},

	// displaying side 
	display_available_phrase: function() {

		if (this.phrase_queue.length > this.last_displayed_phrase) {
			var phrase = this.phrase_queue[this.last_displayed_phrase];
			
			$t = $(Mustache.render(this.translation_tpl, {
				t: phrase.string,
				l: this.get_language( phrase.lang,  this.last_displayed_phrase)
			}));

			this.add_card($t);
			this.last_displayed_phrase++;
		} else {

			if (this.party_status != 'partying') {
				//there won't be any more translations coming, so this party is over 
				this.bust_this_party();

				var quip, type;
				if (this.party_status == 'limit') {
					quip = 'it is unlikely that this phrase will ever reach equilibrium';
					type = 'abject_failure';
					type_message = "Party is busted";
					
				} else {
					// it hit equilibrium then
					this.$results.find('.card:nth-last-child(-n+3)').css({
						background: 'lightgreen'
					});
					quip = this.get_quip(this.phrase_queue[0].string); // quip based on original input
					type = 'success';
					type_message = "Equilibrium found!";
				}

				var $t = $(Mustache.render(this.quip_tpl, {
					"quip": quip,
					"type": type,
					"type_message": type_message
				}));
				this.add_card($t);
			}
		}
	},

	kill_phrases: function(callback) {
		var $cards = this.$results.find('.card');
		var this_card = 0;
		var interval = 50;
		var self = this;
		
		// show cols
		var hide_next_card = function() {
			$($cards[this_card]).transition({
				opacity: 0,
				y: 300,
				rotate: 30
			}, 300);
			this_card++
			if (this_card < $cards.length) {
				setTimeout(hide_next_card, interval);
			} else {
				// no more cards to hide, we're done here
				setTimeout(function(){
					self.$results.empty();
					if (callback) {
						callback.apply(this);
					}					
				}, interval * 3);
			}
		}
		hide_next_card();

	},

	get_quip: function(phrase) {
		var quips, rand;
		for (var i = 0; i < this.quip_types.length; i++) {
			if (phrase.match(this.quip_types[i].match)) {
				quips = this.quip_types[i].quips;
				break;
			}
		}

		rand = Math.floor(Math.random() * (quips.length));
		return quips[rand];
	},
	
	get_language: function(l, index){
		if(l == 'en'){
			if(index == 0){
				return "You said:";
			}
			else{
				return "Back into English";
			}
		}
		else{
			return "into Japanese";
		}
	},

	// what next?
	check_party_progress: function() {
		if (this.phrase_queue.length > 3 && this.phrase_queue[this.phrase_queue.length - 1].lang == 'en' && this.phrase_queue[this.phrase_queue.length - 1].string == this.phrase_queue[this.phrase_queue.length - 3].string) {
			// reached equilibrium
			this.party_status = 'equilibrium';
		} else if (this.phrase_queue.length == PHRASE_LIMIT) {
			// hit the limit
			this.party_status = 'limit';
		} else {
			// carry on then
			this.translate_last_phrase();
		}
	},

	// init
	get_this_party_started: function(partydata) {

		// add initial phrase to queue
		this.phrase_queue.push({
			'lang': 'en',
			'string': partydata.t
		});
			
		var self = this;
		
		// kick off the translating
		this.check_party_progress();
		this.display_available_phrase(); // do one quickly to start
		this.display_interval = setInterval(function() {
			self.display_available_phrase();
		}, HEARTBEAT_TIME);
		
	},

	// stop -- translating and displaying is completely done
	bust_this_party: function() {
		clearInterval(this.display_interval);
	}

};


// party host = this is the controller 
var HEARTBEAT_TIME = 300;
var PHRASE_LIMIT = 40;
var CARD_HEIGHT = 50;


function PartyHost(db_party){
	this.db_party = db_party || false;
	this.$form = $('#form');
	this.active_party = undefined;
	this.init();
}

PartyHost.prototype = {
	start_party: function(phrase){
		var self = this;
		
		var go = function(){
			this.active_party = new Party();
			this.active_party.get_this_party_started({ t: phrase });	
		}
		
		if( typeof(this.active_party) != 'undefined' ){
			this.active_party.bust_this_party();
			this.active_party.kill_phrases(function(){
				go.apply(self);
			});
		}
		else{
			go.apply(self);
		}
	},
	init: function(){
		var self = this;
		this.$form.submit(function(){
			var val = self.$form.find('.phrase').val();
			if(val.length > 0){
				self.start_party(val);		
			}
		});
	}
};