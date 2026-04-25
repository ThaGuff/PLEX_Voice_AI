import { Card, CardHead, Btn } from '../components/UI';
export default function Contacts() {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:700}}>Contacts</h2>
          <p style={{fontSize:13,color:'#8a8680',marginTop:3}}>All callers automatically captured and synced to CRM</p>
        </div>
      </div>
      <div style={{background:'#fff',border:'1.5px solid #e2ddd5',borderRadius:10,padding:48,textAlign:'center',color:'#8a8680'}}>
        <div style={{fontSize:36,marginBottom:12}}>◉</div>
        <div style={{fontSize:14,fontWeight:600,color:'#4a4740',marginBottom:6}}>Contacts sync from your calls</div>
        <div style={{fontSize:12,marginBottom:16}}>Every inbound caller is automatically created as a contact and synced to GHL.</div>
        <button onClick={()=>window.location.href='/settings'} style={{padding:'7px 16px',background:'#2d6a4f',color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer'}}>Configure CRM Sync →</button>
      </div>
    </div>
  );
}
