import React from 'react';
import { observable, action, computed, flow, makeAutoObservable } from "mobx"
import { subscribe, onUpdate } from "rxjs"
import DerivAPI from "@deriv/deriv-api"

export class Store {
    @observable tick = {};
    @observable ticks = [];
    @observable symbols = [];

    constructor() {
        makeAutoObservable(this, {
            fetchLatestTicks: flow.bound,
        })
    }

    get symbols() {
        return this.symbols;
    }

    get ticks() {
        return this.ticks;
    }

    @action.bound
    setTicks(ticks) {
        this.ticks = ticks;
    }

    get tick() {
        return this.tick;
    }

    @action.bound
    setTick(tick) {
        this.tick = tick;
    }

    @action.bound
    fetchSymbols() {
        // TOOD: fetch symbols here later
        return
    }


    *fetchLatestTicks() {
        const api = new DerivAPI({
            endpoint: 'frontend.binaryws.com',
            app_id: 1089
        })

        const tickStream = yield api.ticks("R_100")
        console.log('inside fetchLatestTicks: ', this.setTick)
        tickStream.onUpdate().subscribe(this.updateTicks)
    }
}


// hook to act as the store provider
let context;
export function useStore() {
    // singleton pattern
    if (!context) {
        const store = new Store();
        context  = React.createContext(store)
    }
    return React.useContext(context);
}