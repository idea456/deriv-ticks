import React from 'react';
import { observable, action, computed, flow, makeAutoObservable, onBecomeObserved, onBecomeUnobserved, trace } from "mobx"
import { subscribe, onUpdate } from "rxjs"
import DerivAPI from "@deriv/deriv-api"
// const WebSocket = require('ws')

const APP_ID = 1089
const TOKEN = 'OtijgYJor886Iws'


export class Store {
    @observable tick = {};
    @observable ticks = [];
    @observable assets = [];
    @observable current_asset = "R_100";
    @observable tickStream = null;
    @observable subscription = null;
    @observable connection = null;
    @observable current_api = null;

    constructor() {
        makeAutoObservable(this, {
            fetchLatestTicks: flow.bound,
            fetchAssets: flow.bound
        })

        // onBecomeObserved(this, "tick", this.printTick)
        // onBecomeUnobserved(this, "tick", this.clearStore)
    }

    @action.bound
    unsubscribe() {
        this.subscription.unsubscribe()
    }

    @action.bound
    setTickStream(tickStream) {
        this.tickStream = tickStream
    }

    @computed
    get tick_stream() {
        return this.tickStream
    }


    @computed
    get current_connection() {
        return this.connection
    }

    @computed
    get api() {
        return this.current_api;
    }

    @action.bound
    setConnection(c) {
        this.connection = c
    }

    @action.bound
    setApi(api) {
        trace(this, "api")
        this.current_api = api
    }

    @action.bound
    checkConnection() {
        if (this.connection !== null) {
            this.unsubscribe()
            this.connection.close()
            this.setConnection(null)
        }
        let connection = this.openConnection()
        this.setConnection(connection)
        this.setApi(new DerivAPI({ connection }))
    }

    @computed
    get allAssets() {
        return this.assets;
    }

    @action.bound
    setAssets(assets) {
        this.assets = assets;
    }

    @computed
    get asset() {
        trace()
        return this.current_asset;
    }

    @action.bound
    setAsset(asset) {
        this.current_asset = asset;
    }

    @computed
    get all_ticks() {
        return this.ticks;
    }

    printTick() {
        print(this.tick)
    }


    @action.bound
    setTicks(ticks) {
        this.ticks = ticks;
    }

    @action.bound
    pushTicks(tick) {
        this.ticks.push(tick);
    }

    @action.bound
    popTicks() {
        this.ticks.pop()
    }

    @computed
    get current_tick() {
        return this.tick;
    }

    @computed
    setTick(tick) {
        this.tick = tick;
    }


    *fetchAssets() {
        // TOOD: fetch symbols here later
        const api = new DerivAPI({
            endpoint: 'frontend.binaryws.com',
            app_id: APP_ID
        })
        const activeAssets = yield api.assets()
        this.setAssets(activeAssets)
    }

    openConnection() {
        // let connection = localStorage.getItem('connection');
        // check if a websocket is already connected or opened to ensure we are opening only 1 websocket connection
        // if (!connection || connection.readyState !== 'open') {
        //     connection = new WebSocket(`wss://frontend.binaryws.com/websockets/v3?app_id=${APP_ID}`)
        //     connection.onopen = (e) => {
        //         connection.send(JSON.stringify({
        //             "authorize": TOKEN
        //         }))
        //     }
        //     this.setConnection(connection)
        //     localStorage.setItem('connection', JSON.stringify(connection))
        // }
        if (!this.connection) {
            let connection = new WebSocket(`wss://frontend.binaryws.com/websockets/v3?app_id=${APP_ID}`)
            connection.onopen = (e) => {
                connection.send(JSON.stringify({
                    "authorize": TOKEN
                }))
            }
            this.setConnection(connection)
            return connection;
        }
        return this.connection;
    }

    *fetchLatestTicks(asset) {
        this.checkConnection()
        console.log('api is now', this.current_api)
        const updateTicks = (s) => {
            let latestTick = {
                ask: s.raw.ask,
                bid: s.raw.bid,
                date: new Date(s.raw.epoch)
            }
            this.setTick(latestTick)
            if (this.ticks.length >= 100) {
                this.popTicks()
            }
            this.pushTicks(latestTick)
        }

        this.setTickStream(yield this.current_api.ticks(asset))
        this.subscription = this.tickStream.onUpdate().subscribe(updateTicks)
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