'use strict';

class Errors {
    constructor(){
        this.data = {};
    }

    add(prop, message){
        this.data[prop] = this.data[prop] || [];
        this.data[prop].push(message);
    }

    get fullMessages(){
        return Object.getOwnPropertyNames(this.data).reduce((arr, key) => {
            this.data[key].forEach((message) => {arr.push(`${key} ${message}`)});
            return arr;
        }, []);
    }

    get empty(){
        return Object.getOwnPropertyNames(this.data).length === 0;
    }
}

module.exports = Errors;