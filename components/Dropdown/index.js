import { useState, useMemo, useEffect } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"
import styles from "./Dropdown.module.scss"
import DropdownItem from "./DropdownItem"
import { when, reaction } from "mobx"

function Dropdown() {
    const store = useStore()
    const [symbols, setSymbols] = useState([])
    // const symbols = useMemo(() => fetchingAssets())

    useEffect(() => {
        // initialize assets list only after connection and api has already been established
        const connectionDisposer = when(() => store.connection !== null && store.connection.readyState === 1, async () => {
            // send message to websocket to request for active symbols
            store.requestAssets()
        })

        // once we received our active symbols
        const assetsDisposer = reaction(() => store.assets, (assets) => {
            setSymbols(assets)
        })

        return () => {
            connectionDisposer()
            assetsDisposer()
        }
    }, [])

    const resetTicks = (e) => {
        console.log('[Dropdown] resetting ticks...')
        store.setAsset(JSON.parse(e.target.value))
    }

    return (
        <div className={styles.dropdown}>
            {symbols.length > 0 && <select onChange={resetTicks}>
                {symbols.map((asset, i) => {
                    // Defereference values late to the lowest component to minimize re-rendering
                    return <DropdownItem key={i} asset={asset} />
                })}
            </select>}
        </div>
    )
}

export default observer(Dropdown)