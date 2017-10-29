'use strict';

const ModelBase = require('../../models/base');

class FakeModel extends ModelBase {
	static get before_validate(){
		return ['bv'];
	}

	bv(){
		this.before_validate_called = process.hrtime()[1];
	}

	static get after_validate(){
		return ['av'];
	}

	av(){
		this.after_validate_called = process.hrtime()[1];
	}

	static get before_create(){
		return ['bc'];
	}

	bc(){
		this.before_create_called = process.hrtime()[1];
	}

	static get after_create(){
		return ['ac'];
	}

	ac(){
		this.after_create_called = process.hrtime()[1];
	}

	static get before_update(){
		return ['bu'];
	}

	bu(){
		this.before_update_called = process.hrtime()[1];
	}

	static get after_update(){
		return ['au'];
	}

	au(){
		this.after_update_called = process.hrtime()[1];
	}

	static get before_save(){
		return ['bs'];
	}

	bs(){
		this.before_save_called = process.hrtime()[1];
	}

	static get after_save(){
		return ['as'];
	}

	as(){
		this.after_save_called = process.hrtime()[1];
	}

	static get column_name(){
		return 'fake_models';
	}

	static get renderable_attributes(){
		return ['_id', 'name', {'options': ['hey', 'now', {'what': ['yes']}]}]
	}

	static get renderable_attributes_for_external(){
		return ['name', {'options': ['hey']}];
	}

	static get schema(){
		return {
					name: '',
					ids: [],
					options: {
						hey: '',
						now: '',
						what: {
							yes: '',
							no: '',
							hello: {}
						}

					}
				};
	}

}

module.exports = FakeModel;