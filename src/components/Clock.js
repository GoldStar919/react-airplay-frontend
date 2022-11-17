import moment from "moment";
import { useEffect, useState } from "react";


function Clock() {

  const [state, setState] = useState(false)

  useEffect(()=>{

    const interval = setInterval(()=>{
      setState(moment().format('hh:mm:ss A'))
    },1000)
    return ()=>{
      clearInterval(interval);
    }
  },[])

  return (
    <div className="tracking-wider grid grid-flow-col w-96 h-12 clock text-xl border-2 pl-5 pr-5 self-center">
        <div className="self-center">
            {moment().format('MM/DD/YYYY')}
        </div>
        <div className="self-center">
            {state}
        </div>
    </div>
  );
}

export default Clock;
