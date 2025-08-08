const configuration = {
	// Application Information
	app: {
		name: 'Chess Color Quiz',
		version: '0.1.0',
	},

	// Application defaults
	defaults: {
		numQuestions: 20,
		lightColor: '#dee3e6',
		darkColor: '#8ca2ad',
		rowLimit: 8,
		columnLimit: 8
	},

	// Item Collections
	collection: {

		// Collection of text inputs used in the app
		textInputList: ['#txt_lightSquare', '#txt_darkSquare'],

		// Collection of sliders used in the app
		sliderList: ['#numQuestions'],

	},
};

export default configuration;
