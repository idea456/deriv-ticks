import { useCallback, useMemo } from "react"
import { observer } from "mobx-react"
import { useStore } from "@/store"

function DropdownItem({ asset }) {
    const {display_name: name, symbol} = asset;
    return (
        <option value={JSON.stringify({name, symbol})}>{name}</option>
    )
}


export default observer(DropdownItem)