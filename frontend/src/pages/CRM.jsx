// CRM.jsx
import { useContext } from 'react';
import { AuthCtx } from '../App';
import { Card, CardHead, CardBody, Btn, Badge } from '../components/UI';

export default function CRM() {
  const { org } = useContext(AuthCtx);
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Card>
        <CardHead title="CRM Integration">
          <Badge color={org?.ghl_api_key ? 'green' : 'yellow'} style={{marginLeft:8}}>{org?.ghl_api_key ? 'Connected' : 'Not configured'}</Badge>
        </CardHead>
        <CardBody>
          <div style={{display:'flex',alignItems:'center',gap:11,padding:12,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:7,marginBottom:14}}>
            <span style={{fontSize:22}}>🏗️</span>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>GoHighLevel (GHL)</div>
              <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{org?.ghl_api_key ? `Location: ${org.ghl_location_id||'set'}` : 'Configure in Settings'}</div>
            </div>
            <Btn size="sm" style={{marginLeft:'auto'}}>Configure →</Btn>
          </div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:12,fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'.06em'}}>Sync Actions</div>
          {['Create contact on new caller','Add call note after every call','Tag contact with outcome','Update pipeline on booking','Trigger workflow on missed call','Push voicemail transcript to contact'].map(l => (
            <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:11}}>
              <span style={{color:'var(--text2)'}}>{l}</span>
              <Badge color={org?.ghl_api_key ? 'green' : 'gray'}>{org?.ghl_api_key ? 'active' : 'off'}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHead title="Webhook Endpoint"/>
        <CardBody>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:8}}>Use this URL in GHL → Automation → Webhook to send events to ARIA:</div>
          <div style={{display:'flex',gap:6}}>
            <input readOnly value={`${window.location.origin}/webhooks/ghl`} style={{flex:1,fontFamily:'var(--font-mono)',fontSize:10}}/>
            <Btn size="sm" onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/webhooks/ghl`)}>Copy</Btn>
          </div>
          <div style={{marginTop:16,fontSize:11,color:'var(--text3)'}}>Twilio Voice Webhook URL (set in Twilio console):</div>
          <div style={{display:'flex',gap:6,marginTop:6}}>
            <input readOnly value={`${window.location.origin}/voice/inbound`} style={{flex:1,fontFamily:'var(--font-mono)',fontSize:10}}/>
            <Btn size="sm" onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/voice/inbound`)}>Copy</Btn>
          </div>
          <div style={{marginTop:6,fontSize:10,color:'var(--text3)'}}>Status callback: <code style={{fontFamily:'var(--font-mono)'}}>{window.location.origin}/voice/status</code></div>
        </CardBody>
      </Card>
    </div>
  );
}
