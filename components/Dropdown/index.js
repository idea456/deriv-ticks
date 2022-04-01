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
        console.log("is assets cached?", store.all_assets.length)
        const connectionDisposer = when(() => store.api !== null, async () => {
            const assets = await store.fetchAssets();
            setSymbols(assets)
            store.setAssets(assets)
        })

        const assetsDisposer = reaction(() => store.assets, (assets) => {
            setSymbols(assets)
        })

        return () => {
            connectionDisposer()
        }
    }, [])

    const resetTicks = (e) => {
        console.log('resetting ticks...')
        console.log(JSON.parse(e.target.value))
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