'use strict';

const ModelBase = require('../../models/base');

class FakeModel extends ModelBase {
	static get column_name(){
		return 'fake_models';
	}

	static get renderable_attributes(){
		return ['_id', 'name', {'options': ['hey', 'now', {'what': ['yes']}]}]
	}

}

module.exports = FakeModel;