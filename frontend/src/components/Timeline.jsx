import React from 'react'

export default function Timeline({ events = [] }){
  return (
    <div style={{display:'flex', flexDirection:'column', gap:12}}>
      {events.map((e,i)=>(
        <div key={i} style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <div style={{width:10, height:10, borderRadius:20, background:'var(--green)', marginTop:6}} />
          <div>
            <div style={{fontWeight:700}}>{e.step} <small style={{color:'var(--muted)', marginLeft:8}}>{e.time}</small></div>
            <div style={{color:'var(--muted)'}}>{e.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
