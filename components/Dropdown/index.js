import { useState, useEffect } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"
import styles from "./Dropdown.module.scss"
import DerivAPI from "@deriv/deriv-api"
import { trace } from "mobx"

function Dropdown() {
    const store = useStore()
    useEffect(() => {
        const fetchingAssets = () => {
            // const api = new DerivAPI({
            //     endpoint: 'frontend.binaryws.com',
            //     app_id: 1089
            // })
            // const assets = api.assets();
            // assets.then((res) => {
            //     console.log('assets', res)
            // })
            return
        }
        fetchingAssets()
    }, [])

    const resetTicks = () => {
        console.log('resetting ticks...')
        store.setAsset("R_50")
    }

    return (
        <div className={styles.dropdown}>
            <select>
                <option value="0">R_100</option>
                <option value="1">Hewwo</option>
                <option value="2">Hewwo</option>
            </select>
            <button onClick={resetTicks}>Reset</button>
        </div>
    )
}

export default observer(Dropdown)