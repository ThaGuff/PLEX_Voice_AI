import { SectionHead, Card, CardHead, CardBody, Btn, Badge, Toggle, FormGroup } from '../components/UI';

export default function Reports() {
  return (
    <div>
      <SectionHead title="Reports" desc="Scheduled automated reports delivered to your team"
        action={<Btn variant="primary" icon="+">New Report</Btn>}/>

      {[
        {name:'Daily Call Summary',freq:'Every day at 8:00 AM',recipients:'ryan@plexautomation.io',last:'Today 8:00 AM',active:true},
        {name:'Weekly Performance Digest',freq:'Every Monday at 9:00 AM',recipients:'ryan@plexautomation.io, team@plex.io',last:'Apr 21 9:00 AM',active:true},
        {name:'Monthly ROI Report',freq:'1st of each month',recipients:'ryan@plexautomation.io',last:'Apr 1 8:00 AM',active:false},
      ].map((r,i) => (
        <Card key={i}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px'}}>
            <span style={{fontSize:22}}>📊</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{r.name}</div>
              <div style={{fontSize:12,color:'var(--text-3)'}}>Schedule: {r.freq}</div>
              <div style={{fontSize:11.5,color:'var(--text-4)',marginTop:2}}>Recipients: {r.recipients}</div>
            </div>
            <div style={{textAlign:'right',marginRight:12}}>
              <div style={{fontSize:10.5,color:'var(--text-4)'}}>Last sent</div>
              <div style={{fontSize:12,fontWeight:500}}>{r.last}</div>
            </div>
            <Badge color={r.active?'green':'gray'} dot>{r.active?'Active':'Paused'}</Badge>
            <Toggle on={r.active} onChange={()=>{}} size="sm"/>
            <Btn size="sm">Preview</Btn>
          </div>
        </Card>
      ))}

      <Card>
        <CardHead title="Download Reports"/>
        <CardBody>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[['April 2026 Full Report','PDF · 2.4 MB','Apr 30'],['Q1 2026 Summary','Excel · 1.1 MB','Mar 31'],['Call Log Export','CSV · 340 KB','Today']].map(([name,size,date])=>(
              <div key={name} style={{padding:'12px 14px',background:'var(--surface-2)',border:'1.5px solid var(--border)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>📄</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:12.5}}>{name}</div>
                  <div style={{fontSize:11,color:'var(--text-4)'}}>{size} · {date}</div>
                </div>
                <Btn size="xs">Download</Btn>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
