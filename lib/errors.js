'use strict';

class Errors {
    constructor(){
        this.data = {};
    }

    add(prop, message){
        this.data[prop] = this.data[prop] || [];
        this.data[prop].push(message);
    }

    clear(){
        this.data = {};
        return this;
    }

    get full_messages(){
        return Object.getOwnPropertyNames(this.data).reduce((arr, key) => {
            this.data[key].forEach((message) => {arr.push(`${key} ${message}`)});
            return arr;
        }, []);
    }

    get short_message(){
        let props = Object.getOwnPropertyNames(this.data);
        if(props.length === 0) return undefined;
        let message = '';
        props.forEach((prop, i) => { 
            message = message + `${prop}`;
            if(i < props.length - 1){
                message = message + ', ';
            } else{
                message = message + ' ';
            }
        })

        if(props.length === 1) return `${message}is not valid`;
        return `${message}are not valid`;
    }

    get empty(){
        return Object.getOwnPropertyNames(this.data).length === 0;
    }
}

module.exports = Errors;