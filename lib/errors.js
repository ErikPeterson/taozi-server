'use strict';

class Errors {
    constructor(){
        this.data = {};
    }

    add(key, val){
        this.data[key] = this.data[key] || [];
        this.data[key].push(val);
    }

    fullMessages(){
        return Object.getOwnPropertyNames(this.data).reduce((arr, key) => {
            this.data[key].forEach((message) => arr.push(`#{key} #{message}`));
            return arr;
        }, []);
    }

    empty(){
        return Object.getOwnPropertyNames(this.data).length === 0;
    }
}

module.exports = Errors;