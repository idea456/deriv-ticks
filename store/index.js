import React from 'react';
import { observable, action, computed, flow, makeAutoObservable, spy } from "mobx"
import DerivAPI from "@deriv/deriv-api"
import {OnError} from "rxjs"

const APP_ID = 1089
const TOKEN = 'OtijgYJor886Iws'


export class Store {
    // options variables
    max_history_count = 80;
    default_symbol = {
        name: "AUD Basket",
        symbol: "WLDAUD"
    }

    // observable variables
    @observable tick = {};
    @observable ticks = [];
    @observable assets = [];
    @observable current_asset = this.default_symbol;
    @observable tickStream = null;
    @observable subscription = null;
    @observable connection = null;
    @observable current_api = null;
    @observable error = {
        msg: "",
        isError: false
    };

    constructor() {
        makeAutoObservable(this, {
            fetchLatestTicks: flow.bound,
        })

        spy(e => {
            if (e.type == "reaction") {
                console.log(`[Spy] ${e.name} with args`, e)
            }
        })
    }

    @action.bound
    setError(error) {
        this.error = error
    }

    get error() {
        return this.error
    }

    @action.bound
    unsubscribe() {
        if (this.subscription) this.subscription.unsubscribe()
    }

    @action.bound
    setTickStream(tickStream) {
        this.tickStream = tickStream
    }

    @action.bound
    setSubscription(subscription) {
        this.subscription = subscription
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
        this.current_api = api
    }

    @computed
    get all_assets() {
        return this.assets;
    }

    @action.bound
    setAssets(assets) {
        this.assets = assets;
    }

    @computed
    get asset() {
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

    @action.bound
    setTick(tick) {
        this.tick = tick;
    }


    @action.bound
    handleMessages() {
        // initialize websocket connection if not available
        const ws = this.openConnection()

        ws.onopen = () => {
            // this observable is watched by multiple components
            // whom, once noticed that connection is established, will react and can begin sending their messages
            console.log('[Websocket] Connection has opened.')
            this.setConnection(ws)
        }

        // attach handlers
        ws.onmessage = (m) => {
            const msg = JSON.parse(m.data)
            console.log(`[Websocket] Received message with type ${msg.msg_type}`)
            switch (msg.msg_type) {
                case "history":
                    this.handleTickHistory(msg)
                    break
                case "active_symbols":
                    this.setAssets(msg.active_symbols)
                    console.log("[Store] Active symbols updated.")
                    break
                default:
                    return
            }
        }

        ws.onerror = (m) => {
            console.log("ERRROR", m)
        }

        ws.onclose = () => {
            console.log('[Websocket] Closing...')
            this.setConnection(null)
        }
    }

    @action.bound
    openConnection() {
        if (this.connection) {
            return this.connection;
        }
        let connection = new WebSocket(`wss://frontend.binaryws.com/websockets/v3?app_id=${APP_ID}`)
        connection.onopen = (e) => {
            connection.send(JSON.stringify({
                "authorize": TOKEN
            }))
        }
        return connection;
    }

    @action.bound
    requestAssets() {
        this.connection.send(JSON.stringify({
            active_symbols: "brief",
            "product_type": "basic"
        }))
    }
    // only to be called after connection is opened
    @action.bound
    requestTickHistory(asset) {
        this.connection.send(JSON.stringify({
            ticks_history: asset,
            end: "latest",
            count: this.max_history_count,
            style: "ticks"
        }))
    }

    @action.bound
    handleTickHistory(msg) {
        let { history } = msg
        let { prices, times } = history;
        let ticksHistory = []
        prices.map((price, i) => {
            ticksHistory.push({
                x: new Date(times[i]),
                y: price
            })
        })
        this.setTicks(ticksHistory)
    }

    // Using generators with yield to perform asynchronous actions
    *subscribeToTicks(asset) {
        console.log("[Store] Subscribing to ticks stream...")

        if (this.subscription) {
            this.unsubscribe()
        }
        
        // if the user switches between different symbols, then close/reset the tick stream connection!
        if (this.api) {
            yield this.api.basic.connection.close()   
        }

        let api = new DerivAPI({
            app_id: 1089
        })
        this.setApi(api)
        
        const updateTicks = (s) => {
            if (s.raw.symbol === this.current_asset.symbol) {
                let latestTick = {
                    symbol: s.raw.symbol,
                    ask: s.raw.ask,
                    bid: s.raw.bid,
                    quote: s.raw.quote,
                    date: new Date(s.raw.epoch)
                }
                
                this.setTick(latestTick)
                console.log('latestTick', s.raw)
            }
        }

        try {
            this.setError({
                msg: "",
                isError: false
            })
            this.setTickStream(yield this.api.ticks(asset))
            console.log('tick stream', this.tickStream)
            this.setSubscription(this.tickStream.onUpdate().subscribe(updateTicks))
        } catch({error}) {
            if (error.code === "MarketIsClosed") {
                this.setError({
                    msg: "Market is currently closed.",
                    isError: true
                })
            }
        }
    }
}


// Provider pattern: hook to act as the store provider
let context;
export function useStore() {
    // singleton pattern
    if (!context) {
        const store = new Store();
        context  = React.createContext(store)
    }
    return React.useContext(context);
}