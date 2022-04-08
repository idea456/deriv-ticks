import { observer } from "mobx-react"

function DropdownItem({ asset }) {
    const {display_name: name, symbol} = asset;
    return (
        <option value={JSON.stringify({name, symbol})}>{name}</option>
    )
}


export default observer(DropdownItem)