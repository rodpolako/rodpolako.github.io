const configuration = {
	// Application Information
	app: {
		name: 'Chess Tactics Extractor',
		version: '0.1.5',
	},

	// Application defaults
	defaults: {
		maxGames: 100,
		sensitivity: 2,
		color: '',
		opponent: '',
		rated: '',
		gameSpeed: 'ultraBullet,bullet,blitz,rapid,classical,correspondence',
		since: '',
		until: '',
		bothplayers: false,
		eco: '',
		minimumDepth: 1,
		maxiumDepth: 49
	},

	// Item Collections
	collection: {
		// Collection of checkboxes used in the app
		checkboxlist: ['#checkUltraBullet', '#checkBullet', '#checkBlitz', '#checkRapid', '#checkClassical', '#checkCorrespondence'],

		// Collection of text inputs used in the app
		textInputList: ['#txt_userID', '#txt_opponent', '#txt_eco'],

		// Collection of sliders used in the app
		sliderList: ['#num_games', '#minPly', 'maxPly'],

		// Collection of switches used in the app
		switchList: ['#switchBothPlayers'],
	},
};

export default configuration;
