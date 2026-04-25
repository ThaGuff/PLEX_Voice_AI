import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { SectionHead, Card, CardHead, KPI, DataTable, Badge, Btn, Spinner, Tabs, Alert } from '../components/UI';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(()=>{
    Promise.all([api.adminStats(), api.adminOrgs(), api.adminUsers(), api.adminCalls({limit:20})])
      .then(([s,o,u,c])=>{ setStats(s); setOrgs(o||[]); setUsers(u||[]); setCalls(c||[]); })
      .catch(e=>console.error(e))
      .finally(()=>setLoading(false));
  },[]);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner size={32}/></div>;

  const orgCols = [
    { key:'name', label:'Organization', render:r=><div><div style={{fontWeight:600,fontSize:13}}>{r.name}</div><div style={{fontSize:11,fontFamily:'var(--font-mono)',color:'var(--text-4)'}}>{r.slug}</div></div> },
    { key:'plan', label:'Plan', render:r=><Badge color={r.plan==='agency'?'purple':r.plan==='pro'?'amber':'gray'} dot>{r.plan}</Badge> },
    { key:'user_count', label:'Users', render:r=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{r.user_count||0}</span> },
    { key:'call_count', label:'Total Calls', render:r=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{r.call_count||0}</span> },
    { key:'last_call_at', label:'Last Active', render:r=>r.last_call_at?new Date(r.last_call_at).toLocaleDateString():'Never' },
    { key:'created_at', label:'Joined', render:r=>new Date(r.created_at).toLocaleDateString() },
    { key:'actions', label:'', render:r=>(
      <div style={{display:'flex',gap:5}}>
        <Btn size="xs" onClick={()=>{ const plan=prompt('New plan (starter/pro/agency):',r.plan); if(plan) api.adminUpdateOrg(r.id,{plan}).then(()=>setOrgs(os=>os.map(o=>o.id===r.id?{...o,plan}:o))); }}>Edit Plan</Btn>
      </div>
    )},
  ];

  const userCols = [
    { key:'name', label:'Name', render:r=><div><div style={{fontWeight:600,fontSize:13}}>{r.name}</div><div style={{fontSize:11,color:'var(--text-4)'}}>{r.email}</div></div> },
    { key:'role', label:'Role', render:r=><Badge color={r.role==='superadmin'?'purple':r.role==='owner'?'green':'gray'}>{r.role}</Badge> },
    { key:'org_name', label:'Organization' },
    { key:'org_plan', label:'Plan', render:r=><Badge color={r.org_plan==='agency'?'purple':r.org_plan==='pro'?'amber':'gray'}>{r.org_plan}</Badge> },
    { key:'last_login', label:'Last Login', render:r=>r.last_login?new Date(r.last_login).toLocaleDateString():'Never' },
    { key:'created_at', label:'Joined', render:r=>new Date(r.created_at).toLocaleDateString() },
    { key:'actions', label:'', render:r=>r.role!=='superadmin'&&<Btn size="xs" variant="danger" onClick={()=>{ if(confirm('Delete this user?')) api.adminDeleteUser(r.id).then(()=>setUsers(us=>us.filter(u=>u.id!==r.id))); }}>Delete</Btn> },
  ];

  const totalRevenue = (stats?.orgsByPlan?.starter||0)*297 + (stats?.orgsByPlan?.pro||0)*597 + (stats?.orgsByPlan?.agency||0)*997;

  return (
    <div>
      <SectionHead title="Agency Admin" desc="PLEX Automation — platform overview"/>

      <Alert type="warning" style={{marginBottom:16}}>
        This page is only visible to super admins. Contains sensitive business data.
      </Alert>

      <Tabs tabs={[{key:'overview',label:'Overview'},{key:'orgs',label:'Organizations'},{key:'users',label:'Users'},{key:'calls',label:'All Calls'}]} active={tab} onChange={setTab}/>

      {tab==='overview' && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
            <KPI label="Total Organizations" value={stats?.totalOrgs||0} icon="🏢"/>
            <KPI label="Total Users" value={stats?.totalUsers||0} icon="👤"/>
            <KPI label="Calls (30d)" value={stats?.totalCalls||0} icon="📞"/>
            <KPI label="Appointments (30d)" value={stats?.totalAppointments||0} icon="📅"/>
            <KPI label="Est. MRR" value={`$${totalRevenue.toLocaleString()}`} icon="💰" color="green" up/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {Object.entries(stats?.orgsByPlan||{}).map(([plan,count])=>(
              <Card key={plan}>
                <div style={{padding:'16px 18px',textAlign:'center'}}>
                  <Badge color={plan==='agency'?'purple':plan==='pro'?'amber':'gray'} style={{marginBottom:10}}>{plan}</Badge>
                  <div style={{fontFamily:'var(--font-head)',fontSize:32,fontWeight:700,color:'var(--text)',marginBottom:4}}>{count}</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>organizations</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginTop:6}}>
                    ${(count*(plan==='starter'?297:plan==='pro'?597:997)).toLocaleString()}/mo
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab==='orgs' && (
        <Card style={{marginTop:0}}>
          <DataTable cols={orgCols} rows={orgs} emptyMsg="No organizations yet."/>
        </Card>
      )}

      {tab==='users' && (
        <Card style={{marginTop:0}}>
          <DataTable cols={userCols} rows={users} emptyMsg="No users yet."/>
        </Card>
      )}

      {tab==='calls' && (
        <Card style={{marginTop:0}}>
          <DataTable
            cols={[
              { key:'caller_phone', label:'Caller' },
              { key:'org_name', label:'Organization' },
              { key:'outcome', label:'Outcome', render:r=><Badge color={r.outcome==='missed'?'red':r.outcome==='booked'?'green':'gray'} dot>{r.outcome}</Badge> },
              { key:'duration_seconds', label:'Duration', render:r=>r.duration_seconds?`${Math.floor(r.duration_seconds/60)}m ${r.duration_seconds%60}s`:'—' },
              { key:'started_at', label:'Time', render:r=>new Date(r.started_at).toLocaleString() },
            ]}
            rows={calls} emptyMsg="No calls yet."
          />
        </Card>
      )}
    </div>
  );
}
