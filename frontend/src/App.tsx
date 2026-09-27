import {useEffect,useMemo,useState} from 'react';
import {Link,NavLink,Navigate,Route,Routes,useLocation,useNavigate} from 'react-router-dom';
import {api,token} from './api';import {useAuth} from './auth';
import type{Dashboard as Dash,Deposit,Investment,Package,Question,Quiz,Transaction,User,Withdrawal}from'./types';

function sanitizeSvg(svg:string){return(svg||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/\son\w+=(["']).*?\1/gi,'').replace(/javascript:/gi,'');}
const money=(n:number)=>`GHS ${Number(n||0).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const extUrl=(u:string)=>{const s=(u||'').trim();if(!s)return '';if(/^(https?:\/\/|mailto:|tel:)/i.test(s))return s;return 'https://'+s.replace(/^\/+/,'').replace(/^www\.?/i,m=>m);};
const dt=(v:string)=>new Intl.DateTimeFormat('en-GH',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'CG';
const planSlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const planImage=(p:Package)=>p.image_url&&!p.image_url.startsWith('/assets/')?p.image_url:`/plan-images/${planSlug(p.name)}.svg`;
function AppIcon({name,size=20}:{name:string;size?:number}){const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.9,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};switch(name){
 case'dashboard':return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></svg>;
 case'packages':return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
 case'wallet':return <svg {...common}><path d="M4 6.5h14.5A2.5 2.5 0 0 1 21 9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z"/><circle cx="16.5" cy="13.5" r=".7" fill="currentColor" stroke="none"/></svg>;
 case'quiz':return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.25c-.8.45-1.3.95-1.3 1.75"/><path d="M12 17h.01"/></svg>;
 case'tasks':return <svg {...common}><path d="M9 5h6M9 3h6v4H9z"/><path d="M7 5H5a2 2 0 0 0-2 2v13h18V7a2 2 0 0 0-2-2h-2"/><path d="m8 14 2.3 2.3L16 11"/></svg>;
 case'referrals':return <svg {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M14 15.5a4.5 4.5 0 0 1 6.5 4"/></svg>;
 case'ads':return <svg {...common}><path d="m4 13 13-6v10L4 13Z"/><path d="M17 10a3 3 0 0 1 0 4M6 14l1.5 6h4L10 15"/></svg>;
 case'notifications':return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
 case'profile':return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>;
 case'admin':return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.4.3.8.6 1 .9.2.3.3.7.3 1.1h.1v4h-.1c-.4 0-.8.1-1.3.4Z"/></svg>;
 case'deposit':return <svg {...common}><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/></svg>;
 case'withdraw':return <svg {...common}><path d="M12 17V5M7.5 9.5 12 5l4.5 4.5"/><path d="M5 21h14"/></svg>;
 case'logout':return <svg {...common}><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 8l4 4-4 4M18 12H8"/></svg>;
 case'chevron':return <svg {...common}><path d="m9 5 7 7-7 7"/></svg>;
 case'clock':return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
 case'check':return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
 case'refresh':return <svg {...common}><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.5-1L20 12M4 12l2.4 5a7 7 0 0 0 11.5-1"/></svg>;
 default:return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>}}
function Spinner(){return <span className="spinner" aria-hidden="true"/>}
function SkeletonLine({wide,short}:{wide?:boolean;short?:boolean}){return <div className={`skeleton skeleton-line${wide?' wide':''}${short?' short':''}`}/>}
function SkeletonCard(){return <div className="card skeleton-loading"><SkeletonLine/><SkeletonLine wide/><SkeletonLine short/><SkeletonLine short/></div>}
function SkeletonPage(){return <div className="skeleton-loading" style={{padding:'24px 0'}}><div className="skeleton skeleton-line" style={{height:28,width:'40%',marginBottom:16}}/><div style={{display:'flex',gap:16,margin:'14px 0'}}><div className="skeleton skeleton-card" style={{flex:1}}/><div className="skeleton skeleton-card" style={{flex:1}}/><div className="skeleton skeleton-card" style={{flex:1}}/></div><SkeletonLine wide/><SkeletonLine/><SkeletonLine wide/><SkeletonLine short/></div>}function Empty({children}:{children:React.ReactNode}){return <div className="empty"><span>—</span><p>{children}</p></div>}
function Alert({kind='info',children}:{kind?:string;children:React.ReactNode}){return <div className={`alert ${kind}`}>{children}</div>}
function Status({v}:{v:string}){return <span className={`status ${v}`}>{v}</span>}

function useTheme(){
 const[theme,setTheme]=useState<'light'|'dark'>(()=>{
  try{
   const saved=localStorage.getItem('cedigain-theme');
   if(saved==='dark'||saved==='light')return saved;
  }catch{}
  return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
 });
 useEffect(()=>{
  document.documentElement.setAttribute('data-theme',theme);
  try{localStorage.setItem('cedigain-theme',theme)}catch{}
 },[theme]);
 function toggle(){setTheme(v=>v==='dark'?'light':'dark')}
 return {theme,toggle};
}
function Logo({compact=false}:{compact?:boolean}){return <div className="logo" aria-label="CEDIGAIN"><img className="logo-mark" src="/cedi-mark.svg" alt="" width={36} height={36}/><div className={compact?'sr-only':'logo-word'}><b className="logo-name" aria-hidden="true"><span className="ln-c">C</span><span className="ln-edi">EDI</span><span className="ln-gain">GAIN</span></b><span className="logo-tag">CEDI UP · WE FEAST</span></div></div>}
function Toast({message,onClose}:{message:string;onClose:()=>void}){useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t)},[message]);return <div className="toast"><b>Live admin alert</b><span>{message}</span><button onClick={onClose}>×</button></div>}
function useLiveRefresh(events:string[],reload:()=>void){const key=events.join('|');useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent).detail;if(events.includes(detail?.event))reload()};window.addEventListener('cedigain:live',handler);return()=>window.removeEventListener('cedigain:live',handler)},[key,reload])}

function AuthPage({initialMode='login'}:{initialMode?:'login'|'register'}){
 const{login,register}=useAuth();
 const{theme,toggle}=useTheme();
 const[mode,setMode]=useState<'login'|'register'>(initialMode);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[captcha,setCaptcha]=useState<{token:string;svg:string}|null>(null);
 const[cfg,setCfg]=useState<any>(null);
 const[form,setForm]=useState({full_name:'',phone:'',password:'',confirm_password:'',captcha_answer:'',referral_code:''});
 const nav=useNavigate();
 const bonus=Number(cfg?.signup_bonus??10);

 async function loadCaptcha(){try{setCaptcha(await api<{token:string;svg:string}>('/api/captcha/new'))}catch{setCaptcha(null)}}
 useEffect(()=>{
  const ref=new URLSearchParams(location.search).get('ref');
  if(ref){setForm(f=>({...f,referral_code:ref.toUpperCase()}));setMode('register')}
  loadCaptcha();
  api<any>('/api/public/config').then(setCfg).catch(()=>{});
 },[]);
 useEffect(()=>{setMode(initialMode)},[initialMode]);

 function change(k:string,v:string){setForm(f=>({...f,[k]:v}))}
 function switchMode(next:'login'|'register'){
  if(next===mode)return;
  setMode(next);setError('');
  nav(next==='login'?'/login':'/signup',{replace:true});
  if(next==='register')loadCaptcha();
 }

 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   if(mode==='register'){
    if(form.password!==form.confirm_password){setError('Passwords do not match');setBusy(false);return}
    if(form.password.length<6){setError('Password must be at least 6 characters');setBusy(false);return}
   }
   if(mode==='login')await login(form.phone.trim(),form.password);
   else await register({...form,phone:form.phone.trim(),captcha_token:captcha?.token||'',referral_code:form.referral_code||undefined});
   nav('/dashboard');
  }catch(err:any){
   setError(err.message||'Something went wrong');
   if(mode==='register')loadCaptcha();
  }finally{setBusy(false)}
 }

 return (
  <main className="auth-screen auth-premium">
   <header className="auth-topbar">
    <Link to="/" className="auth-topbar-brand" aria-label="CEDIGAIN home"><Logo/></Link>
    <nav className="auth-topbar-nav">
     <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle theme">{theme==='dark'?'Light':'Dark'}</button>
     <Link to="/login" className={mode==='login'?'on':''}>Log in</Link>
     <Link to="/signup" className={`auth-topbar-cta${mode==='register'?' on':''}`}>Sign up</Link>
    </nav>
   </header>

   <div className="auth-body">
    <div className="auth-side">
     <span className="eyebrow light">CEDI UP · WE FEAST</span>
     <h1>{mode==='login'?'Access your workspace.':'Start with a welcome credit.'}</h1>
     <p>{mode==='login'
       ?'Sign in to manage packages, daily earnings, ads and MoMo withdrawals.'
       :'Create an account and receive a signup bonus credited to your wallet.'}</p>
     {mode==='register'&&(
      <div className="auth-bonus-panel">
       <span className="auth-bonus-label">SIGNUP BONUS</span>
       <strong>GHS {bonus.toFixed(2)}</strong>
       <small>Credited instantly when your account is created</small>
      </div>
     )}
     <ul className="auth-side-list">
      <li>Phone-based secure login</li>
      <li>Transparent GHS ledger</li>
      <li>MoMo deposits & payouts</li>
     </ul>
    </div>

    <div className="auth-main">
     <div className="auth-box">
      <div className="auth-box-tabs" role="tablist">
       <button type="button" role="tab" className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>Log in</button>
       <button type="button" role="tab" className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>Sign up</button>
      </div>
      <h2>{mode==='login'?'Log in':'Create account'}</h2>
      <p className="auth-box-sub">{mode==='login'?'Enter your phone number and password.':'Register with your phone to get started.'}</p>

      {mode==='register'&&(
       <div className="signup-reward signup-reward-hero">
        <div>
         <span>WELCOME BONUS</span>
         <p>Receive <b>GHS {bonus.toFixed(2)}</b> when you complete signup</p>
        </div>
        <strong>₵{bonus.toFixed(0)}</strong>
       </div>
      )}
      {error&&<Alert kind="error">{error}</Alert>}

      <form onSubmit={submit} noValidate>
       {mode==='register'&&(
        <label>Full name
         <input value={form.full_name} onChange={e=>change('full_name',e.target.value)} placeholder="Your full name" autoComplete="name" required/>
        </label>
       )}
       <label>Phone number
        <input value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="024 000 0000" inputMode="tel" autoComplete="tel" required/>
       </label>
       <label>Password
        <input type="password" value={form.password} onChange={e=>change('password',e.target.value)} minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} required/>
       </label>
       {mode==='register'&&(
        <>
         <label>Confirm password
          <input type="password" value={form.confirm_password} onChange={e=>change('confirm_password',e.target.value)} autoComplete="new-password" required/>
         </label>
         <label>Referral code <small>Optional</small>
          <input value={form.referral_code} onChange={e=>change('referral_code',e.target.value.toUpperCase())} placeholder="Inviter code"/>
         </label>
         <div className="captcha">
          <div dangerouslySetInnerHTML={{__html:sanitizeSvg(captcha?.svg||'')}}/>
          <button type="button" className="icon-btn" onClick={loadCaptcha} aria-label="Refresh security code"><AppIcon name="refresh" size={19}/></button>
         </div>
         <label>Security code
          <input value={form.captcha_answer} onChange={e=>change('captcha_answer',e.target.value.toUpperCase())} maxLength={5} required/>
         </label>
        </>
       )}
       <button className="btn primary wide auth-submit" disabled={busy}>
        {busy?<><Spinner/> Please wait</>:mode==='login'?'Log in':`Create account · Get ₵${bonus.toFixed(0)}`}
       </button>
      </form>
      <p className="legal">
       {mode==='login'
         ?<>New here? <Link to="/signup">Create an account</Link></>
         :<>Already registered? <Link to="/login">Log in</Link></>}
      </p>
     </div>
    </div>
   </div>
  </main>
 );
}


function LandingPage(){
 const nav=useNavigate();
 return (
  <main className="landing">
   <header className="landing-nav">
    <Logo/>
    <nav>
     <a href="#how">How it works</a>
     <a href="#reach">Advertise</a>
     <button type="button" className="theme-toggle landing-theme" onClick={()=>{const cur=document.documentElement.getAttribute('data-theme')||'light';const next=cur==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('cedigain-theme',next)}catch{}}} aria-label="Toggle theme"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/></svg></button>
     <Link to="/login" className="landing-nav-login">Log in</Link>
    </nav>
   </header>

   <section className="landing-hero">
    <span className="landing-kicker">CEDIGAIN</span>
    <h1>Grow your cedi with clarity and control.</h1>
    <p>Manage packages, daily income and Mobile Money withdrawals — all in one secure workspace. Optional marketplace ads help you reach more people on the platform.</p>
    <div className="landing-cta-row">
     <button type="button" className="landing-cta" onClick={()=>nav('/signup')}>Get Started</button>
     <Link to="/login" className="landing-cta-ghost">Log in</Link>
    </div>
    <p className="landing-trust">Phone login · Verified deposits · GHS ledger</p>
   </section>

   <section className="landing-features" id="how">
    <article>
     <b>01</b>
     <h3>Fund with MoMo</h3>
     <p>Pay from MTN, Telecel or AirtelTigo. Credits post after verification.</p>
    </article>
    <article>
     <b>02</b>
     <h3>Buy a package</h3>
     <p>Fixed price, daily income and term shown upfront on every plan.</p>
    </article>
    <article>
     <b>03</b>
     <h3>Earn & withdraw</h3>
     <p>Answer the daily questions to unlock income, then cash out to MoMo.</p>
    </article>
    <article id="reach">
     <b>04</b>
     <h3>Run ads</h3>
     <p>Place marketplace ads to reach more customers across the CEDIGAIN platform.</p>
    </article>
    <article>
     <b>05</b>
     <h3>Refer to earn</h3>
     <p>Invite friends to join CEDIGAIN using your referral link and earn rewards for each successful referral.</p>
    </article>
   </section>

   <section className="landing-band">
    <div>
     <span className="eyebrow light">CEDI UP · WE FEAST</span>
     <h2>Invest, promote, and track everything in one ledger.</h2>
     <p>Referrals, tasks and ad placements sit next to your balance and package history — no extra apps.</p>
     <button type="button" className="landing-cta" onClick={()=>nav('/signup')}>Create account</button>
    </div>
   </section>

   <footer className="landing-footer">
    
    <span>© {new Date().getFullYear()} CEDIGAIN</span>
   </footer>
  </main>
 );
}


function assistantReply(q,c){
 const t=(q||'').toLowerCase();const m=(n)=>money(n);
 const dep=Number(c.min_deposit!=null?c.min_deposit:100),wd=Number(c.min_withdrawal!=null?c.min_withdrawal:50),fee=Number(c.withdrawal_fee!=null?c.withdrawal_fee:16);
 const l1=Number(c.referral_l1!=null?c.referral_l1:20),l2=Number(c.referral_l2!=null?c.referral_l2:10),l3=Number(c.referral_l3!=null?c.referral_l3:3);
 const adr=Number(c.ad_reward!=null?c.ad_reward:0.5),bonus=Number(c.signup_bonus!=null?c.signup_bonus:10);
 if(/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))return "Hi! I'm the CEDIGAIN assistant. Ask me about deposits, withdrawals, packages, daily income, referrals, tasks or the ad marketplace.";
 if(/deposit|add money|fund|top ?up|recharge/.test(t))return `To add funds go to Wallet → Deposit. The minimum deposit is ${m(dep)}. Send the exact amount by Mobile Money to our merchant number, then tap "I have paid". An admin verifies it and your Deposit Credit updates. Deposit Credit buys packages and is not withdrawable.`;
 if(/withdraw|cash ?out|payout/.test(t))return `Withdrawals come from your Earnings Credit only. The minimum is ${m(wd)} and a ${fee}% fee applies. Open Wallet → Withdraw, enter your MoMo details, and an admin approves the payout.`;
 if(/package|invest|plan|buy|purchase/.test(t))return "Open the Packages page to see each plan's fixed price, daily income and duration. Packages are bought with Deposit Credit. Once active, the daily income is credited automatically to your Earnings Credit every day for the plan's duration.";
 if(/daily income|unlock|question|quiz/.test(t))return "Each day, answer the 5 daily questions on the Daily questions page to unlock that day's income. After that, your active packages' income is credited automatically.";
 if(/referr|invite|refer|downline/.test(t))return `Share your referral code from the Referrals page. You earn ${l1}% from level 1, ${l2}% from level 2 and ${l3}% from level 3 — all paid to your Earnings Credit.`;
 if(/task/.test(t))return `Open the Task Center to complete optional activities and sponsored visits. Advertiser visits pay ${m(adr)} once per day after you spend a minute on their site.`;
 if(/\bads?\b|advertise|marketplace|gift|sponsor/.test(t))return `On the Advertise page or in the Task Center, tap "Visit advertiser", stay on their site at least one minute, then come back and claim your ${m(adr)} gift. Each advertiser gift can be claimed once per day.`;
 if(/bonus|sign ?up|welcome/.test(t))return `New members receive a welcome bonus of ${m(bonus)} on sign up.`;
 if(/balance|wallet|credit|earning/.test(t))return "Your displayed balance combines two internal wallets: Deposit Credit (buys packages, not withdrawable) and Earnings Credit (from daily income, referrals, tasks and bonuses, which is what you can withdraw).";
 if(/telegram|support|contact|help|human|agent/.test(t))return "You can reach our team on Telegram using the Telegram button next to this chat.";
 return "I'm not certain about that one. Try asking about deposits, withdrawals, packages, daily income, referrals, tasks or the ad marketplace, or tap the Telegram button to reach our team.";
}
function FloatingWidgets(){
 const[cfg,setCfg]=useState<any>(null),[open,setOpen]=useState(false),[input,setInput]=useState('');
 const[msgs,setMsgs]=useState<{role:string;text:string}[]>([{role:'bot',text:"Hi! I'm the CEDIGAIN assistant. Ask me about deposits, withdrawals, packages, referrals, tasks or the ad marketplace."}]);
 useEffect(()=>{api<any>('/api/public/config').then(setCfg).catch(()=>{})},[]);
 const chips=['How do I deposit?','How do withdrawals work?','How do referrals pay?','How do ad gifts work?'];
 function send(text:string){const q=(text||'').trim();if(!q)return;const reply=assistantReply(q,cfg||{});setMsgs(mm=>[...mm,{role:'me',text:q},{role:'bot',text:reply}]);setInput('')}
 const waRaw=(cfg&&(cfg.whatsapp_link||cfg.telegram_link))||'https://wa.me/233000000000'; // set whatsapp_link in admin settings
 const wa=extUrl(String(waRaw).replace('t.me/','wa.me/').replace('https://t.me/','https://wa.me/'));
 return <>{!open&&<div className="fab-stack"><a className="fab wa" href={wa} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.1 17.4L2 22l4.7-1.2A11 11 0 1 0 20.5 3.5zM12 20.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.8.7.7-2.7-.2-.3a8.2 8.2 0 1 1 6.8 3.7zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.3-1.3-1.5-.1-.2 0-.3.1-.4.1-.1.2-.2.3-.4.1-.1.1-.2.2-.4 0-.2 0-.3 0-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.6.4 0 1.3-.5 1.5-1 .2-.5.2-.9.1-1 0-.1-.2-.2-.4-.3z"/></svg></a><button className="fab ai" onClick={()=>setOpen(true)} title="AI assistant" aria-label="Open assistant"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.7 8.7 0 0 1-4-.9L3 20l1.4-4.4A8.5 8.5 0 1 1 21 11.5z"/></svg></button></div>}{open&&<div className="assistant-panel"><header><div><b>CEDIGAIN Assistant</b><small>Answers common questions instantly</small></div><button onClick={()=>setOpen(false)} aria-label="Close">×</button></header><div className="assistant-body">{msgs.map((mm,i)=><div key={i} className={`amsg ${mm.role}`}>{mm.text}</div>)}</div><div className="assistant-chips">{chips.map(cq=><button key={cq} type="button" onClick={()=>send(cq)}>{cq}</button>)}</div><form className="assistant-input" onSubmit={e=>{e.preventDefault();send(input)}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask a question..."/><button className="btn primary" type="submit">Send</button></form><a className="assistant-tg" href={tg} target="_blank" rel="noopener noreferrer">Need a human? Message us on Telegram →</a></div>}</>;
}
function ImageUpload({value,onChange,label='Image'}:{value:string;onChange:(u:string)=>void;label?:string}){
 const[busy,setBusy]=useState(false),[err,setErr]=useState('');
 async function pick(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files&&e.target.files[0];if(!file)return;setBusy(true);setErr('');try{const fd=new FormData();fd.append('file',file);const tk=token();const res=await fetch('/api/uploads',{method:'POST',headers:tk?{Authorization:`Bearer ${tk}`}:{},body:fd});if(!res.ok)throw new Error('Upload failed');const j=await res.json();onChange(j.url)}catch(ex:any){setErr(ex.message||'Upload failed')}finally{setBusy(false);e.target.value=''}}
 return <div className="uploader"><span className="uploader-label">{label}</span><div className="uploader-box">{value?<img src={value} alt="preview"/>:<span className="uploader-empty">No image selected</span>}<div className="uploader-actions"><label className="btn secondary sm">{busy?'Uploading...':(value?'Change image':'Upload from device')}<input type="file" accept="image/*" onChange={pick} hidden/></label>{value&&<button type="button" className="btn ghost sm" onClick={()=>onChange('')}>Remove</button>}</div></div>{err&&<small className="ad-msg">{err}</small>}</div>;
}

const NAV=[['/dashboard','dashboard','Overview'],['/packages','packages','Packages'],['/wallet','wallet','Wallet'],['/questions','quiz','Daily questions'],['/tasks','tasks','Task Center'],['/referrals','referrals','Referrals'],['/marketplace','ads','Advertise'],['/notifications','notifications','Notifications'],['/profile','profile','Profile']] as const;
const ADMIN_NAV=[['overview','dashboard','Overview'],['deposits','deposit','Deposits'],['withdrawals','withdraw','Withdrawals'],['packages','packages','Plans'],['questions','quiz','Questions'],['tasks','tasks','Tasks'],['ads','ads','Advertisements'],['broadcasts','notifications','Broadcasts'],['users','referrals','Members'],['logs','tasks','Activity logs'],['settings','admin','Settings']] as const;
function Shell(){const{user,logout}=useAuth();const loc=useLocation();const{theme,toggle}=useTheme();const[unread,setUnread]=useState(0),[toast,setToast]=useState(''),[overlay,setOverlay]=useState<any>(null),[banner,setBanner]=useState<any>(null),[menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{setMenuOpen(false);window.scrollTo(0,0);const _m=document.querySelector('.app-main');if(_m)_m.scrollTop=0;const _w=document.querySelector('.page-wrap');if(_w)_w.scrollTop=0},[loc.pathname]);
 useEffect(()=>{api<any[]>('/api/notifications').then(x=>{setUnread(x.filter(n=>!n.is_read).length);const fresh=x.filter(n=>!n.is_read);setBanner(fresh.find(n=>n.type==='banner')||null);setOverlay(fresh.find(n=>n.type==='popup'||n.type==='image')||null)}).catch(()=>{})},[loc.pathname]);
 useEffect(()=>{const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/live?token=${token()}`);ws.onmessage=e=>{const x=JSON.parse(e.data);window.dispatchEvent(new CustomEvent('cedigain:live',{detail:x}));if(user?.is_admin&&x.event==='withdrawal.created'){const m=`New withdrawal: ${x.payload.phone} — ${money(x.payload.amount)}`;setToast(m);if('Notification'in window&&Notification.permission==='granted')new Notification('CEDIGAIN',{body:m,icon:'/cedi-mark.svg',badge:'/cedi-mark.svg',tag:'cedigain-admin',renotify:true})}else if(user?.is_admin)setToast(`${x.event.replace('.',' ')} updated`)};return()=>ws.close()},[user?.id,user?.is_admin]);
 async function enablePush(){
  try{
   if(!('Notification'in window))return;
   if(Notification.permission==='default')await Notification.requestPermission();
   if(Notification.permission==='granted'&&'serviceWorker'in navigator){
    const reg=await navigator.serviceWorker.ready.catch(()=>null);
    // permission ready for local notifications (admin alerts via WS)
   }
  }catch{}
 }
 useEffect(()=>{if(user?.is_admin)enablePush()},[user?.is_admin])
 async function dismiss(n:any){await api(`/api/notifications/${n.id}/read`,{method:'POST'});if(overlay?.id===n.id)setOverlay(null);if(banner?.id===n.id)setBanner(null);setUnread(v=>Math.max(0,v-1))}
 const adminMode=Boolean(user?.is_admin&&loc.pathname.startsWith('/admin'));
 return <div className="app-shell">{banner&&<div className="global-banner"><b>{banner.title}</b><span>{banner.message}</span><button onClick={()=>dismiss(banner)}>×</button></div>}{menuOpen&&<div className="nav-backdrop" onClick={()=>setMenuOpen(false)}/>}<aside className={`sidebar${menuOpen?' open':''}`}><Logo/><nav>{NAV.map(([to,ic,label])=><NavLink key={to} to={to} className={({isActive})=>isActive?'active':''}><span><AppIcon name={ic}/></span>{label}</NavLink>)}{user?.is_admin&&<NavLink to="/admin" className={({isActive})=>isActive?'active':''}><span><AppIcon name="admin"/></span>Admin console</NavLink>}</nav><div className="side-user"><span className="avatar">{initials(user?.full_name||'')}</span><div><b>{user?.full_name}</b><span>{user?.phone}</span></div><button onClick={logout} aria-label="Log out"><AppIcon name="logout" size={19}/></button></div></aside><div className="app-main"><header className="topbar"><div className="topbar-left"><button className="menu-btn" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><div className="mobile-logo"><Logo/></div><div className="breadcrumb"><span>Workspace</span><b>{NAV.find(x=>loc.pathname.startsWith(x[0]))?.[2]||'Admin console'}</b></div></div><div className="top-actions"><div className="header-balance"><span>Available balance</span><b>{money(user?.balance||0)}</b></div><button type="button" className="theme-toggle" onClick={toggle} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?(<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>):(<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/></svg>)}</button><Link to="/notifications" className="bell"><AppIcon name="notifications" size={19}/>{unread>0&&<i>{unread}</i>}</Link><Link to="/profile" className="avatar">{initials(user?.full_name||'')}</Link></div></header><div className="page-wrap" key={loc.pathname}><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/packages" element={<Packages/>}/><Route path="/wallet/*" element={<Wallet/>}/><Route path="/questions" element={<DailyQuestions/>}/><Route path="/tasks" element={<Tasks/>}/><Route path="/referrals" element={<Referrals/>}/><Route path="/marketplace" element={<Marketplace/>}/><Route path="/notifications" element={<Notifications/>}/><Route path="/profile" element={<Profile/>}/>{user?.is_admin&&<Route path="/admin/*" element={<Admin onPush={enablePush}/>}/>}<Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></div></div><nav className={`bottom-nav${adminMode?' admin-bottom-nav':''}`}>{adminMode?ADMIN_NAV.filter(x=>['overview','deposits','withdrawals','users','settings'].includes(x[0])).map(([section,ic,label])=><NavLink key={section} to={`/admin/${section}`}><span><AppIcon name={ic}/></span><small>{label}</small></NavLink>):[NAV[0],NAV[1],NAV[2],NAV[3],NAV[5],NAV[8]].map(([to,ic,label])=><NavLink key={to} to={to}><span><AppIcon name={ic}/></span><small>{label==='Daily questions'?'Questions':label}</small></NavLink>)}</nav><FloatingWidgets/>{overlay&&<div className="notice-backdrop"><article className="notice-modal">{overlay.image_url&&<img src={overlay.image_url} alt="Platform notice"/>}<div><span>{overlay.type}</span><h2>{overlay.title}</h2><p>{overlay.message}</p><button className="btn primary" onClick={()=>dismiss(overlay)}>Continue</button></div></article></div>}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</div>}

function PageHead({eyebrow,title,sub,action}:{eyebrow?:string;title:string;sub:string;action?:React.ReactNode}){return <div className="page-head"><div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{sub}</p></div>{action}</div>}
function Dashboard(){
 const{user}=useAuth();
 const[data,setData]=useState<Dash|null>(null);
 const[withdrawals,setWithdrawals]=useState<any[]>([]);
 function mergePayouts(next:any[]){
  setWithdrawals(previous=>{
   const merged=[] as any[],seen=new Set<string>();
   for(const item of [...next,...previous]){
    const key=String(item.id||`${item.withdrawal_number}-${item.amount}-${item.at||''}`);
    if(!seen.has(key)){seen.add(key);merged.push(item)}
   }
   return merged.slice(0,80);
  });
 }
 async function loadPayouts(){try{mergePayouts(await api<any[]>('/api/public/recent-withdrawals'))}catch{}}
 useEffect(()=>{
  api<Dash>('/api/dashboard').then(setData);
  loadPayouts();
  const timer=window.setInterval(loadPayouts,30000);
  const live=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.event==='withdrawals.changed')loadPayouts()};
  window.addEventListener('cedigain:live',live);
  return()=>{window.clearInterval(timer);window.removeEventListener('cedigain:live',live)};
 },[]);
 if(!data)return <SkeletonPage/>;
 const wdList=withdrawals.length?withdrawals:[50,84,126,158,196,215,248,275,300,72,142,232].map((amount,i)=>({
  id:`fallback-${i}`,
  withdrawal_number:`+233${['57','24','55','20','54','59','26','27','50','25','53','56'][i]}******`,
  amount
 }));
 const firstName=(user?.full_name||'Member').split(' ')[0];

 return (
  <div className="dash">
   <header className="dash-head">
    <div>
     <span className="eyebrow">OVERVIEW</span>
     <h1>Hello, {firstName}</h1>
     <p>Balance, plans and activity in one place.</p>
    </div>
   </header>

   <div className="withdraw-marquee" aria-label="Recent payouts">
    <b><i/> RECENT PAYOUTS</b>
    <div className="withdraw-window">
     <div className="withdraw-track">
      {[...wdList,...wdList].map((x,i)=>(
       <span key={`${x.id||i}-${i}`} className="withdraw-item">
        <span className="wd-phone">{x.withdrawal_number}</span> withdrew <span className="wd-amount">GHS {Number(x.amount).toFixed(2)}</span>
       </span>
      ))}
     </div>
    </div>
   </div>

   <section className="dash-hero">
    <article className="dash-balance">
     <div className="dash-balance-top">
      <span>Available balance</span>
      <Link to="/wallet">Wallet</Link>
     </div>
     <h2>{money(data.balance)}</h2>
     <div className="dash-balance-actions">
      <Link className="dash-bal-btn fill" to="/wallet/deposit"><AppIcon name="deposit" size={18}/> Deposit</Link>
      <Link className="dash-bal-btn ghost" to="/wallet/withdraw"><AppIcon name="withdraw" size={18}/> Withdraw</Link>
     </div>
    </article>
    <div className="dash-metrics">
     <article>
      <span>Total earned</span>
      <b>{money(data.total_income)}</b>
      <small>Lifetime package income</small>
     </article>
     <article>
      <span>Active plans</span>
      <b>{data.active_investments}</b>
      <small>{data.active_investments===1?'Plan earning daily':'Plans earning daily'}</small>
     </article>
     <article>
      <span>Withdrawable</span>
      <b>{money(user?.withdrawable ?? 0)}</b>
      <small>Earnings eligible for payout</small>
     </article>
    </div>
   </section>

   <section className="dash-quick">
    <Link to="/packages" className="dash-quick-item">
     <span className="dash-qi">01</span>
     <div><b>Buy a package</b><small>Fixed daily income</small></div>
    </Link>
    <Link to="/questions" className="dash-quick-item">
     <span className="dash-qi">02</span>
     <div><b>Daily questions</b><small>Unlock today’s income</small></div>
    </Link>
    <Link to="/marketplace" className="dash-quick-item">
     <span className="dash-qi">03</span>
     <div><b>Run ads</b><small>Reach more customers</small></div>
    </Link>
    <Link to="/referrals" className="dash-quick-item">
     <span className="dash-qi">04</span>
     <div><b>Referrals</b><small>Share your code</small></div>
    </Link>
   </section>

   <div className="dash-grid">
    <section className="dash-card">
     <div className="dash-card-head">
      <div><h2>Active plans</h2><p>Current earning progress</p></div>
      <Link to="/packages">Browse</Link>
     </div>
     {data.investments.length?(
      <div className="dash-plans">
       {data.investments.map(x=>(
        <div className="dash-plan" key={x.id}>
         <div className="dash-plan-top">
          <span className="package-mark">{x.package_name[0]}</span>
          <div>
           <b>{x.package_name}</b>
           <small>{money(x.amount)} invested</small>
          </div>
          <div className="dash-plan-earn">
           <b>{money(x.daily_income)}</b>
           <small>/ day</small>
          </div>
         </div>
         <div className="dash-progress">
          <div className="dash-progress-meta"><span>Progress</span><span>{x.progress}%</span></div>
          <div className="progress"><i style={{width:`${Math.min(100,Number(x.progress)||0)}%`}}/></div>
         </div>
        </div>
       ))}
      </div>
     ):(
      <Empty>No active plans yet. <Link to="/packages">View packages</Link></Empty>
     )}
    </section>

    <section className="dash-card">
     <div className="dash-card-head">
      <div><h2>Recent activity</h2><p>Latest wallet movements</p></div>
      <Link to="/wallet/history">View all</Link>
     </div>
     <TransactionList items={data.transactions}/>
    </section>
   </div>

   {data.alerts.length>0&&(
    <section className="dash-card dash-alerts">
     <div className="dash-card-head"><div><h2>Notices</h2></div></div>
     {data.alerts.slice(0,2).map(x=>(
      <div className="dash-alert" key={x.id}>
       <b>{x.title}</b>
       <p>{x.message}</p>
      </div>
     ))}
    </section>
   )}
  </div>
 );
}


function PageLoading(){return <div className="page-loading" role="status"><div className="loader-orbit"><span/><span/><span/><i/></div><b>Loading workspace</b><small>Please wait a moment</small></div>}
function TransactionList({items}:{items:Transaction[]}){return items.length?<div className="transaction-list">{items.map(x=><div key={x.id}><span className={`txn-icon ${x.amount>=0?'in':'out'}`}><AppIcon name={x.amount>=0?'deposit':'withdraw'} size={16}/></span><p><b>{x.type.replace('_',' ')}</b><small>{x.note||dt(x.created_at)}</small></p><strong className={x.amount>=0?'positive':'negative'}>{x.amount>=0?'+':''}{money(x.amount)}</strong></div>)}</div>:<Empty>No transactions recorded yet.</Empty>}

function Packages(){const[items,setItems]=useState<Package[]>([]),[investments,setInvestments]=useState<Investment[]>([]),[selected,setSelected]=useState<Package|null>(null),[amount,setAmount]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[success,setSuccess]=useState<Package|null>(null),[loading,setLoading]=useState(true);async function load(){const[a,b]=await Promise.all([api<Package[]>('/api/packages'),api<Investment[]>('/api/investments')]);setItems(a);setInvestments(b);setLoading(false)}useEffect(()=>{load()},[]);useLiveRefresh(['packages.changed','settings.changed'],load);async function buy(e:React.FormEvent){e.preventDefault();if(!selected)return;const bought=selected;setBusy(true);setError('');try{await api('/api/investments',{body:{package_id:bought.id,amount:Number(amount)}});setSelected(null);setAmount('');setSuccess(bought);window.setTimeout(()=>setSuccess(null),4200);await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}if(loading)return <PageLoading/>;return <><PageHead eyebrow="INVESTMENT CATALOG" title="Structured packages" sub="Compare terms, daily income and duration before committing funds."/><div className="package-grid">{items.map(x=><article className={`package-card live ${x.featured?'featured':''}`} key={x.id}><span className="live-pill"><i/>Live</span>{x.featured&&<span className="ribbon">Preferred</span>}<img src={planImage(x)} alt={`${x.name} digital server plan`} className="package-img" loading="lazy" onError={e=>{const img=e.currentTarget;img.onerror=null;img.src='/cedi-mark.svg'}}/><div className="package-top"><span className="package-mark large">{x.name[0]}</span><Status v={x.status}/></div><h2>{x.name}</h2><p>{x.description}</p><dl><div><dt>Price</dt><dd>{money(x.price??x.min_amount)}</dd></div><div><dt>Daily income</dt><dd className="positive">{money(x.daily_income)}</dd></div><div><dt>Duration</dt><dd>{x.duration_days} days</dd></div></dl><button className="btn primary wide" onClick={()=>{setSelected(x);setAmount(String(x.price??x.min_amount))}} disabled={x.status!=='active'}>{x.status==='active'?<><span className="plan-select-full">Select package</span><span className="plan-select-mobile">Select</span></>:<><span className="plan-select-full">Currently unavailable</span><span className="plan-select-mobile">Unavailable</span></>}</button></article>)}</div><section className="card portfolio"><div className="card-head"><div><h2>Your portfolio</h2><p>Active and completed positions</p></div></div>{investments.length?<div className="table-wrap"><table><thead><tr><th>Package</th><th>Principal</th><th>Daily</th><th>Progress</th><th>Status</th></tr></thead><tbody>{investments.map(x=><tr key={x.id}><td><b>{x.package_name}</b></td><td>{money(x.amount)}</td><td>{money(x.daily_income)}</td><td>{x.days_credited}/{x.duration_days} days</td><td><Status v={x.status}/></td></tr>)}</tbody></table></div>:<Empty>No investments yet.</Empty>}</section>{selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">CONFIRM PURCHASE</span><h2>{selected.name}</h2><p className="muted">Packages are purchased from deposit credit only.</p>{error&&<Alert kind="error">{error}</Alert>}<form onSubmit={buy}><div className="summary-box"><span>Package price<b>{money(selected.price??selected.min_amount)}</b></span><span>Daily income<b>{money(selected.daily_income)}</b></span><span>Duration<b>{selected.duration_days} days</b></span></div><button className="btn primary wide" disabled={busy}>{busy?<Spinner/>:'Confirm investment'}</button></form></div></div>}{success&&<div className="purchase-success-backdrop" onClick={()=>setSuccess(null)}><article className="purchase-success" onClick={e=>e.stopPropagation()}><div className="success-burst"><i/><i/><i/><i/><i/><i/></div><div className="success-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12.5 3.4 3.4L18 7.8"/></svg></div><span className="eyebrow">PURCHASE COMPLETE</span><h2>{success.name} is active</h2><p>Your plan was purchased successfully and has been added to your portfolio.</p><div className="success-plan"><img src={planImage(success)} alt=""/><div><span>Daily income</span><b>{money(success.daily_income)}</b><small>{success.duration_days}-day term</small></div></div><Link className="btn primary wide" to="/dashboard" onClick={()=>setSuccess(null)}>View dashboard</Link></article></div>}</>}


function Wallet(){return <Routes><Route index element={<WalletHome/>}/><Route path="deposit" element={<DepositStart/>}/><Route path="deposit/pay" element={<DepositPay/>}/><Route path="withdraw" element={<Withdraw/>}/><Route path="history" element={<History/>}/><Route path="*" element={<Navigate to="/wallet" replace/>}/></Routes>}
function WalletHome(){const[deps,setDeps]=useState<Deposit[]|null>(null),[wds,setWds]=useState<Withdrawal[]|null>(null);useEffect(()=>{Promise.all([api<Deposit[]>('/api/deposits/mine'),api<Withdrawal[]>('/api/withdrawals/mine')]).then(([a,b])=>{setDeps(a);setWds(b)})},[]);if(!deps||!wds)return <PageLoading/>;return <><PageHead eyebrow="WALLET OPERATIONS" title="Fund and withdraw" sub="Manage payment requests and follow every status change."/><div className="wallet-actions"><Link to="/wallet/deposit"><span><AppIcon name="deposit" size={23}/></span><div><b>Make a deposit</b><p>Fund your package purchasing balance through MoMo.</p></div><i><AppIcon name="chevron" size={18}/></i></Link><Link to="/wallet/withdraw"><span><AppIcon name="withdraw" size={23}/></span><div><b>Request withdrawal</b><p>Withdraw earnings to your saved MoMo account.</p></div><i><AppIcon name="chevron" size={18}/></i></Link></div><div className="content-grid"><RequestCard title="Recent deposits" rows={deps}/><RequestCard title="Recent withdrawals" rows={wds}/></div></>}
function RequestCard({title,rows}:{title:string;rows:(Deposit|Withdrawal)[]}){return <section className="card"><div className="card-head"><h2>{title}</h2></div>{rows.length?<div className="request-list">{rows.slice(0,6).map(x=><div key={x.id}><p><b>{money(x.amount)}</b><small>{x.network} · {dt(x.created_at)}</small></p><Status v={x.status}/></div>)}</div>:<Empty>No requests yet.</Empty>}</section>}
function DepositStart(){
 const nav=useNavigate();
 const[info,setInfo]=useState<any>(null);
 const[form,setForm]=useState({amount:'',momo_number:'',network:'MTN',momo_name:''});
 const[error,setError]=useState('');
 useEffect(()=>{api('/api/deposits/info').then(setInfo)},[]);
 function next(e:React.FormEvent){
  e.preventDefault();
  if(!info)return;
  if(Number(form.amount)<Number(info.min_deposit||100)){setError(`Minimum deposit is ${money(info.min_deposit||100)}`);return}
  sessionStorage.setItem('deposit_draft',JSON.stringify({...form,amount:Number(form.amount)}));
  nav('/wallet/deposit/pay');
 }
 if(!info)return <PageLoading/>;
 return (
  <div className="deposit-shell">
   <ol className="deposit-stepper" aria-label="Deposit steps">
    <li className="current"><i>1</i><span>Details</span></li>
    <li><i>2</i><span>Pay</span></li>
    <li><i>3</i><span>Confirm</span></li>
   </ol>

   <div className="deposit-notice">
    <div className="deposit-notice-icon" aria-hidden="true">!</div>
    <div>
     <b>Manual Mobile Money only</b>
     <p>Send the exact amount from your MoMo account, then confirm on the next screen. Funds appear after admin verification.</p>
    </div>
   </div>

   <PageHead eyebrow="DEPOSIT" title="Fund your wallet" sub="Enter the amount and the MoMo account you will pay from."/>

   <form className="deposit-panel" onSubmit={next}>
    {error&&<Alert kind="error">{error}</Alert>}

    <div className="deposit-amount-block">
     <span className="deposit-amount-label">Amount to fund</span>
     <div className="deposit-amount-row">
      <span className="deposit-currency">GHS</span>
      <input
       className="deposit-amount-input"
       type="number"
       min={info.min_deposit||100}
       step="0.01"
       value={form.amount}
       onChange={e=>setForm({...form,amount:e.target.value})}
       placeholder={String(info.min_deposit||100)}
       required
       inputMode="decimal"
      />
     </div>
     <small className="deposit-min-hint">Minimum {money(info.min_deposit||100)}</small>
    </div>

    <div className="deposit-fields">
     <div className="field">
      <label htmlFor="dep-momo">MoMo number</label>
      <input id="dep-momo" value={form.momo_number} onChange={e=>setForm({...form,momo_number:e.target.value})} inputMode="tel" placeholder="024 000 0000" minLength={7} required/>
     </div>
     <div className="field">
      <label htmlFor="dep-network">Network</label>
      <select id="dep-network" value={form.network} onChange={e=>setForm({...form,network:e.target.value})}>
       <option>MTN</option>
       <option>Telecel</option>
       <option>AirtelTigo</option>
      </select>
     </div>
     <div className="field field-span">
      <label htmlFor="dep-name">Account name</label>
      <input id="dep-name" value={form.momo_name} onChange={e=>setForm({...form,momo_name:e.target.value})} placeholder="Name registered on MoMo" minLength={2} required/>
     </div>
    </div>

    <div className="deposit-actions">
     <Link className="btn secondary" to="/wallet">Cancel</Link>
     <button type="submit" className="btn primary">Continue to pay</button>
    </div>
   </form>
  </div>
 );
}
function DepositPay(){const nav=useNavigate();const[draft]=useState<any>(()=>{try{return JSON.parse(sessionStorage.getItem('deposit_draft')||'null')}catch{return null}}),[info,setInfo]=useState<any>(null),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false);useEffect(()=>{if(!draft)nav('/wallet/deposit',{replace:true});else api('/api/deposits/info').then(setInfo)},[]);async function copyMerchant(){const num=String(info?.merchant_number||'').trim();if(!num)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(num);else{const ta=document.createElement('textarea');ta.value=num;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta)}setCopied(true);window.setTimeout(()=>setCopied(false),1800)}catch{}}async function paid(){setBusy(true);setError('');try{await api('/api/deposits',{body:draft});sessionStorage.removeItem('deposit_draft');setDone(true)}catch(e:any){setError(e.message)}finally{setBusy(false)}}if(!draft||!info)return <PageLoading/>;if(done)return <div className="narrow deposit-shell"><section className="card pending-screen"><span className="pending-icon"><AppIcon name="clock" size={34}/></span><Status v="pending"/><h1>Payment submitted</h1><p>Your deposit is awaiting admin verification. Balance updates after approval.</p><div className="receipt"><span>Amount<b>{money(draft.amount)}</b></span><span>Network<b>{draft.network}</b></span><span>Your MoMo<b>{draft.momo_number}</b></span></div><Link className="btn primary" to="/wallet">Back to wallet</Link></section></div>;return <div className="payment-page deposit-shell"><div className="payment-head"><Link to="/wallet/deposit">← Back</Link><div><span>SECURE PAYMENT</span><b>Step 2 of 2</b></div></div><div className="payment-layout"><section className="merchant-panel"><span className="eyebrow light">MOBILE MONEY</span><h1>Send exact amount</h1><p>Transfer to the verified merchant account, then confirm below.</p><div className="amount-due"><span>Amount due</span><b>{money(draft.amount)}</b></div><div className="merchant-card"><span>Merchant</span><h3>{info.merchant_name}</h3><dl><div><dt>Network</dt><dd>{info.merchant_network}</dd></div><div><dt>MoMo number</dt><dd className="momo-copy-line"><b className="merchant-number">{info.merchant_number}</b><button type="button" className={`copy-icon-btn${copied?' on':''}`} onClick={copyMerchant} aria-label={copied?'Copied':'Copy merchant number'} title={copied?'Copied':'Copy'}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{copied?<path d="M5 13l4 4L19 7"/>:<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>}</svg></button></dd></div><div><dt>Account name</dt><dd>{info.merchant_account_name}</dd></div></dl></div></section><section className="payment-steps"><span className="eyebrow">INSTRUCTIONS</span><h2>Complete on your phone</h2><ol><li><i>1</i><div><b>Open MoMo</b><p>Use your network app or USSD code.</p></div></li><li><i>2</i><div><b>Send {money(draft.amount)}</b><p>Pay {info.merchant_number} exactly.</p></div></li><li><i>3</i><div><b>Confirm name</b><p>Recipient should read {info.merchant_account_name}.</p></div></li><li><i>4</i><div><b>Return here</b><p>Only continue after payment succeeds.</p></div></li></ol><Alert>{info.instructions}</Alert>{error&&<Alert kind="error">{error}</Alert>}<button className="btn primary wide large" onClick={paid} disabled={busy}>{busy?<><Spinner/> Submitting…</>:'I have paid'}</button><p className="secure-note">Do not confirm before the transfer is complete.</p></section></div></div>}
function Withdraw(){
 const[info,setInfo]=useState<any>(null);
 const[rows,setRows]=useState<Withdrawal[]>([]);
 const[form,setForm]=useState({amount:'',momo_number:'',network:'MTN',momo_name:''});
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const[success,setSuccess]=useState<any>(null);
 async function load(){
  const[a,b]=await Promise.all([api<any>('/api/withdrawals/info'),api<Withdrawal[]>('/api/withdrawals/mine')]);
  setInfo(a);setRows(b);
  setForm(f=>({...f,...a.saved,amount:f.amount,network:a.saved.network||'MTN'}));
 }
 useEffect(()=>{load()},[]);
 const amount=Number(form.amount||0);
 const fee=amount*(info?.fee_percent||16)/100;
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  const request={...form,amount};const estimatedFee=fee;
  try{
   const result=await api<any>('/api/withdrawals',{body:request});
   setSuccess({
    amount:Number(result.amount??amount),
    fee:Number(result.fee??estimatedFee),
    net_amount:Number(result.net_amount??Math.max(0,amount-estimatedFee)),
    network:request.network,
    momo_number:request.momo_number
   });
   setForm({...form,amount:''});
   await load();
  }catch(e:any){setError(e.message)}
  finally{setBusy(false)}
 }
 if(!info)return <PageLoading/>;
 return (
  <div className="withdraw-shell">
   <PageHead eyebrow="WITHDRAWAL" title="Withdraw earnings" sub="Move withdrawable earnings to your Mobile Money account."/>

   <div className="withdraw-layout">
    <form className="withdraw-panel" onSubmit={submit}>
     <div className="withdraw-available">
      <span>Withdrawable earnings</span>
      <b>{money(info.withdrawable)}</b>
      <small>Only earnings can be withdrawn · Fee {info.fee_percent}%</small>
     </div>

     {error&&<Alert kind="error">{error}</Alert>}

     <div className="withdraw-amount-block">
      <span className="withdraw-amount-label">Amount to withdraw</span>
      <div className="withdraw-amount-row">
       <span className="withdraw-currency">GHS</span>
       <input
        className="withdraw-amount-input"
        type="number"
        min={info.minimum}
        max={info.withdrawable}
        step="0.01"
        value={form.amount}
        onChange={e=>setForm({...form,amount:e.target.value})}
        placeholder={String(info.minimum)}
        required
        inputMode="decimal"
       />
      </div>
      <small className="withdraw-min-hint">Minimum {money(info.minimum)}</small>
     </div>

     <div className="withdraw-fields">
      <div className="field">
       <label htmlFor="wd-momo">MoMo number</label>
       <input id="wd-momo" value={form.momo_number} onChange={e=>setForm({...form,momo_number:e.target.value})} inputMode="tel" placeholder="024 000 0000" required/>
      </div>
      <div className="field">
       <label htmlFor="wd-network">Network</label>
       <select id="wd-network" value={form.network} onChange={e=>setForm({...form,network:e.target.value})}>
        <option>MTN</option>
        <option>Telecel</option>
        <option>AirtelTigo</option>
       </select>
      </div>
      <div className="field field-span">
       <label htmlFor="wd-name">Account name</label>
       <input id="wd-name" value={form.momo_name} onChange={e=>setForm({...form,momo_name:e.target.value})} placeholder="Name on MoMo" required/>
      </div>
     </div>

     <div className="withdraw-fee-card">
      <div><span>Requested</span><b>{money(amount)}</b></div>
      <div><span>Fee ({info.fee_percent}%)</span><b className="negative">− {money(fee)}</b></div>
      <div className="withdraw-fee-net"><span>You receive</span><b>{money(Math.max(0,amount-fee))}</b></div>
     </div>

     <button className="btn primary wide" disabled={busy||amount<info.minimum}>
      {busy?<Spinner/>:'Submit withdrawal'}
     </button>
    </form>

    <div className="withdraw-side">
     <RequestCard title="Recent requests" rows={rows}/>
     <div className="withdraw-note">
      <b>Before you submit</b>
      <ul>
       <li>Only package earnings are withdrawable</li>
       <li>Requests are reviewed before payout</li>
       <li>Use the same number registered on MoMo</li>
      </ul>
     </div>
    </div>
   </div>

   {success&&(
    <div className="purchase-success-backdrop withdrawal-success-backdrop" onClick={()=>setSuccess(null)}>
     <article className="purchase-success withdrawal-success" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
      <div className="success-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12.5 3.4 3.4L18 7.8"/></svg></div>
      <span className="eyebrow">REQUEST SUBMITTED</span>
      <h2>Withdrawal pending approval</h2>
      <p>Your withdrawal of <b>{money(success.amount)}</b> was submitted and awaits admin review.</p>
      <div className="withdrawal-success-summary">
       <span>Requested<b>{money(success.amount)}</b></span>
       <span>Fee<b>− {money(success.fee)}</b></span>
       <span>You will receive<b>{money(success.net_amount)}</b></span>
       <span>Destination<b>{success.network} · {success.momo_number}</b></span>
      </div>
      <button className="btn primary wide" onClick={()=>setSuccess(null)}>Done</button>
     </article>
    </div>
   )}
  </div>
 );
}


function History(){const[items,setItems]=useState<Transaction[]|null>(null);useEffect(()=>{api<Transaction[]>('/api/wallet/transactions?limit=200').then(setItems)},[]);if(!items)return <PageLoading/>;return <><PageHead eyebrow="LEDGER" title="Transaction history" sub="Every credit and debit recorded in one transparent timeline."/><section className="card"><TransactionList items={items}/></section></>}

function DailyQuestions(){const[quiz,setQuiz]=useState<Quiz|null>(null),[index,setIndex]=useState(0),[selected,setSelected]=useState(''),[feedback,setFeedback]=useState<any>(null),[busy,setBusy]=useState(false);async function load(){setQuiz(await api('/api/daily-quiz'))}useEffect(()=>{load()},[]);const unanswered=quiz?.questions.filter(x=>!x.answered)||[],q=unanswered[index]||unanswered[0];async function submit(){if(!q||!selected)return;setBusy(true);try{const x=await api<any>('/api/daily-quiz/answer',{body:{question_id:q.id,selected}});setFeedback(x)}finally{setBusy(false)}}function next(){setSelected('');setFeedback(null);load();setIndex(0)}if(!quiz)return <PageLoading/>;if(quiz.completed)return <div className="quiz-shell"><div className="quiz-complete"><span><AppIcon name="check" size={34}/></span><p className="eyebrow">DAILY REQUIREMENT COMPLETE</p><h1>Earnings unlocked</h1><p>You answered all five questions. Active package income has been processed automatically for today.</p><div><b>{quiz.score}/5</b><small>Correct answers</small></div><Link className="btn primary" to="/dashboard">Return to overview</Link></div></div>;return <div className="quiz-shell"><div className="quiz-header"><div><span className="eyebrow light">DAILY EARNING REQUIREMENT</span><h1>Today’s five questions</h1><p>Answer each question once. You will see the explanation immediately.</p></div><div className="quiz-count"><b>{quiz.answered}</b><span>of 5 complete</span></div></div><div className="quiz-progress">{[0,1,2,3,4].map(n=><i className={n<quiz.answered?'done':n===quiz.answered?'current':''} key={n}/>)}</div>{q&&<section className="question-card"><div className="question-meta"><span>{q.category}</span><b>Question {quiz.answered+1} of 5</b></div><h2>{q.text}</h2><div className="answers">{Object.entries(q.options).map(([k,v])=><button key={k} disabled={!!feedback} className={`${selected===k?'selected':''} ${feedback?(k===feedback.correct_option?'correct':selected===k?'wrong':''):''}`} onClick={()=>setSelected(k)}><i>{k}</i><span>{v}</span></button>)}</div>{feedback&&<div className={`feedback ${feedback.correct?'success':'error'}`}><b>{feedback.correct?'Correct answer':'Not quite — review the answer'}</b><p>{feedback.explanation}</p></div>}<div className="question-actions"><span>{feedback?'Feedback recorded. Continue when ready.':'Select one answer to continue.'}</span>{feedback?<button className="btn primary" onClick={next}>{feedback.completed?'Finish':'Next question →'}</button>:<button className="btn primary" onClick={submit} disabled={!selected||busy}>{busy?<Spinner/>:'Check answer'}</button>}</div></section>}</div>}

function Tasks(){const[items,setItems]=useState<any[]>([]),[ads,setAds]=useState<any[]>([]),[loading,setLoading]=useState(true),[message,setMessage]=useState('');async function load(){const[tk,ad]=await Promise.all([api<any[]>('/api/tasks'),api<any[]>('/api/ads').catch(()=>[] as any[])]);setItems(tk);setAds(ad);setLoading(false)}useEffect(()=>{load()},[]);useLiveRefresh(['tasks.changed','ads.changed'],load);async function complete(x:any){try{const r=await api<any>(`/api/tasks/${x.id}/complete`,{body:{elapsed_seconds:x.timer_seconds}});setMessage(`Task complete. ${money(r.reward)} credited.`);setItems(await api('/api/tasks'))}catch(e:any){setMessage(e.message)}}return <div className="task-platform"><header><Logo compact/><div><span>CEDIGAIN TASK CENTER</span><h1>Complete optional activities.<br/>Earn verified rewards.</h1><p>Tasks are separate from the daily question requirement and depend on availability.</p></div></header>{message&&<Alert>{message}</Alert>}{loading?<PageLoading/>:items.length?<div className="task-grid">{items.map(x=><article key={x.id}><span>{x.category}</span><h2>{x.title}</h2><p>{x.description}</p><div><b>{money(x.reward)}</b><small>reward</small></div>{x.external_link&&<a href={extUrl(x.external_link)} target="_blank" rel="noopener noreferrer">Open activity ↗</a>}<button className="btn task-btn" onClick={()=>complete(x)} disabled={!x.available}>{x.available?'Complete task':'Daily limit reached'}</button></article>)}</div>:<div className="task-empty"><b>No tasks available at the moment.</b><p>New optional activities will appear here when published by the admin team.</p></div>}{ads.length>0&&<section className="sponsored-tasks"><div className="sponsored-head"><span>SPONSORED · VISIT & EARN</span><h2>Advertiser tasks</h2><p>Visit an advertiser and stay about a minute to claim your gift.</p></div><div className="ad-grid">{ads.map(x=><AdCard key={x.id} ad={x} onClaimed={load}/>)}</div></section>}</div>}
function Referrals(){const[data,setData]=useState<any>(null),[copied,setCopied]=useState(false);useEffect(()=>{api('/api/referrals').then(setData)},[]);if(!data)return <PageLoading/>;return <><PageHead eyebrow="REFERRAL NETWORK" title="Grow your network" sub="Share your code and follow verified commission activity."/><section className="referral-hero"><div><span>Your referral code</span><h2>{data.code}</h2><button onClick={()=>{navigator.clipboard.writeText(`${location.origin}/signup?ref=${data.code}`);setCopied(true)}}>{copied?'Link copied':'Copy invitation link'}</button></div><div><span>Total commissions</span><h2>{money(data.total)}</h2><p>20% · 10% · 3% across three levels</p></div></section><div className="content-grid"><section className="card"><div className="card-head"><h2>Direct members</h2></div>{data.members.length?<div className="people-list">{data.members.map((x:any,i:number)=><div key={i}><span className="avatar">{initials(x.name)}</span><p><b>{x.name}</b><small>{x.phone}</small></p><small>{dt(x.joined)}</small></div>)}</div>:<Empty>No referred members yet.</Empty>}</section><section className="card"><div className="card-head"><h2>Commission activity</h2></div>{data.commissions.length?<div className="request-list">{data.commissions.map((x:any,i:number)=><div key={i}><p><b>Level {x.level} commission</b><small>{x.percent}% · {dt(x.created_at)}</small></p><strong className="positive">+{money(x.amount)}</strong></div>)}</div>:<Empty>No referral commissions yet.</Empty>}</section></div></>}
function AdCard({ad,onClaimed}:{ad:any;onClaimed:()=>void}){const[phase,setPhase]=useState<'idle'|'counting'|'ready'|'claimed'>(ad.claimed_today?'claimed':'idle'),[left,setLeft]=useState(60),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);useEffect(()=>{if(phase!=='counting')return;if(left<=0){setPhase('ready');return}const t=setTimeout(()=>setLeft(l=>l-1),1000);return()=>clearTimeout(t)},[phase,left]);function visit(){if(ad.link)window.open(extUrl(ad.link),'_blank','noopener,noreferrer');setLeft(60);setPhase('counting')}async function claim(){setBusy(true);setMsg('');try{const r=await api<any>(`/api/ads/${ad.id}/reward`,{body:{elapsed_seconds:60}});setPhase('claimed');setMsg(`Gift credited: ${money(r.reward)}`);onClaimed()}catch(e:any){setMsg(e.message)}finally{setBusy(false)}}const canEarn=ad.link&&ad.reward>0;return <article className="ad-card">{ad.image_url&&<img src={ad.image_url}/>}<div><span>SPONSORED</span><h2>{ad.title}</h2><p>{ad.description}</p>{canEarn?<div className="ad-earn">{phase==='claimed'?<span className="ad-claimed">✓ {msg||'Gift already claimed today'}</span>:phase==='idle'?<button className="btn primary wide" onClick={visit}>Visit advertiser & earn {money(ad.reward)} →</button>:phase==='counting'?<button className="btn secondary wide" disabled>Stay on their site… {left}s left</button>:<><button className="btn primary wide" onClick={claim} disabled={busy}>{busy?<Spinner/>:`Claim your ${money(ad.reward)} gift`}</button>{msg&&<small className="ad-msg">{msg}</small>}</>}<small className="ad-hint">Spend at least one minute on the advertiser's site, then claim your gift.</small></div>:ad.link?<a href={extUrl(ad.link)} target="_blank" rel="noopener noreferrer">Visit advertiser →</a>:null}</div></article>}
function Marketplace(){const[items,setItems]=useState<any[]|null>(null),[open,setOpen]=useState(false),[form,setForm]=useState({title:'',description:'',image_url:'',link:'',duration_days:1}),[message,setMessage]=useState('');async function load(){setItems(await api<any[]>('/api/ads'))}useEffect(()=>{load()},[]);useLiveRefresh(['ads.changed'],load);async function submit(e:React.FormEvent){e.preventDefault();try{const x=await api<any>('/api/ads',{body:form});setMessage(`Advertisement submitted for review. ${money(x.price)} charged.`);setOpen(false);load()}catch(e:any){setMessage(e.message)}}if(!items)return <PageLoading/>;return <><PageHead eyebrow="AD MARKETPLACE" title="Advertise with us" sub="Publish approved campaigns to the CEDIGAIN member network." action={<button className="btn primary" onClick={()=>setOpen(true)}>Create campaign</button>}/>{message&&<Alert>{message}</Alert>}<div className="ad-grid">{items.length?items.map(x=><AdCard key={x.id} ad={x} onClaimed={load}/>):<Empty>No approved advertisements are live right now.</Empty>}</div>{open&&<div className="modal-backdrop"><form className="modal" onSubmit={submit}><button type="button" className="modal-close" onClick={()=>setOpen(false)}>×</button><h2>Create campaign</h2><label>Campaign title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><ImageUpload label="Campaign image" value={form.image_url} onChange={u=>setForm({...form,image_url:u})}/><label>Destination link<input value={form.link} onChange={e=>setForm({...form,link:e.target.value})}/></label><label>Duration (days)<input type="number" min="1" max="90" value={form.duration_days} onChange={e=>setForm({...form,duration_days:Number(e.target.value)})}/></label><button className="btn primary wide">Submit for approval</button></form></div>}</>}

function Notifications(){const[items,setItems]=useState<any[]|null>(null);async function load(){setItems(await api<any[]>('/api/notifications'))}useEffect(()=>{load()},[]);useLiveRefresh(['notifications.changed'],load);async function read(id:number){await api(`/api/notifications/${id}/read`,{method:'POST'});load()}if(!items)return <PageLoading/>;return <><PageHead eyebrow="MESSAGE CENTER" title="Notifications" sub="Account updates, approvals and platform announcements."/><section className="notification-list">{items.length?items.map(x=><article className={`notification-card ${x.is_read?'':'unread'}`} key={x.id}>{x.image_url&&<img src={x.image_url} alt="Notification"/>}<div><span>{x.type}</span><h2>{x.title}</h2><p>{x.message}</p><small>{dt(x.created_at)}</small></div>{!x.is_read&&<button onClick={()=>read(x.id)}>Mark read</button>}</article>):<Empty>No notifications yet.</Empty>}</section></>}
function Profile(){const{user,setUser,logout}=useAuth();const[tab,setTab]=useState('account'),[transactions,setTransactions]=useState<Transaction[]>([]),[form,setForm]=useState({full_name:user?.full_name||'',email:user?.email||'',telegram:user?.telegram||'',notify_transactions:user?.notify_transactions??true,notify_marketing:user?.notify_marketing??true}),[pw,setPw]=useState({current_password:'',new_password:'',confirm_password:''}),[message,setMessage]=useState(''),[error,setError]=useState('');const[profileReady,setProfileReady]=useState(false);useEffect(()=>{api<Transaction[]>('/api/wallet/transactions?limit=30').then(rows=>{setTransactions(rows);setProfileReady(true)})},[]);async function save(e:React.FormEvent){e.preventDefault();setError('');try{const x=await api<User>('/api/users/me',{method:'PATCH',body:form});setUser(x);setMessage('Profile changes saved.')}catch(e:any){setError(e.message)}}async function changePassword(e:React.FormEvent){e.preventDefault();setError('');try{const x=await api<any>('/api/users/change-password',{body:pw});setMessage(x.message);setPw({current_password:'',new_password:'',confirm_password:''});window.setTimeout(logout,900)}catch(e:any){setError(e.message)}}if(!user)return null;if(!profileReady)return <PageLoading/>;return <><section className="profile-hero"><div className="profile-hero-avatar"><span className="avatar xl">{initials(user.full_name)}</span><div><Status v="active"/></div></div><div className="profile-hero-info"><span className="eyebrow light">MEMBER PROFILE</span><h1>{user.full_name}</h1><p><span className="profile-phone">{user.phone}</span><span className="profile-sep">·</span><span>Since {new Date(user.created_at).toLocaleDateString('en-GH',{year:'numeric',month:'long'})}</span></p></div></section><div className="profile-stats"><article><span>Total balance</span><b>{money(user.balance)}</b><small>Combined wallet</small></article><article><span>Withdrawable</span><b className="positive">{money(user.withdrawable)}</b><small>Available for payout</small></article><article><span>Referral code</span><b>{user.referral_code}</b><small>Share to earn 20·10·3%</small></article><article><span>Status</span><b>{user.is_admin?'Administrator':'Verified member'}</b><small>Account standing</small></article></div><div className="profile-tabs">{['account','security','activity','preferences'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>{message&&<Alert kind="success">{message}</Alert>}{error&&<Alert kind="error">{error}</Alert>}{tab==='account'&&<div className="content-grid"><form className="card form-card" onSubmit={save}><div className="card-head"><div><h2>Personal details</h2><p>Keep your identity and contact information current.</p></div></div><div className="field-grid"><label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/></label><label>Phone number<input value={user.phone} disabled/></label></div><label>Email address<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com"/></label><label>Telegram username<input value={form.telegram} onChange={e=>setForm({...form,telegram:e.target.value})} placeholder="@username"/></label><div className="form-actions"><button className="btn primary">Save details</button></div></form><div className="profile-sidebar"><section className="card" style={{marginBottom:16}}><div className="card-head"><h2>Quick links</h2></div><Link to="/wallet/deposit" className="profile-link"><span><AppIcon name="deposit" size={20}/></span><div><b>Make a deposit</b><small>Fund your account via MoMo</small></div></Link><Link to="/wallet/withdraw" className="profile-link"><span><AppIcon name="withdraw" size={20}/></span><div><b>Request withdrawal</b><small>Payout to your MoMo account</small></div></Link><Link to="/referrals" className="profile-link"><span><AppIcon name="referrals" size={20}/></span><div><b>Referral network</b><small>Invite members and earn</small></div></Link></section><section className="card"><div className="card-head"><h2>Session</h2></div><p className="muted" style={{fontSize:'.78rem',margin:'0 0 14px'}}>Securely end your session on this device.</p><button className="btn danger wide" onClick={logout}>Log out</button></section></div></div>}{tab==='security'&&<div className="content-grid"><form className="card form-card" onSubmit={changePassword}><div className="card-head"><div><h2>Change password</h2><p>Use a strong, unique password to protect your account.</p></div></div><label>Current password<input type="password" value={pw.current_password} onChange={e=>setPw({...pw,current_password:e.target.value})} autoComplete="current-password" required/></label><label>New password<input type="password" minLength={6} value={pw.new_password} onChange={e=>setPw({...pw,new_password:e.target.value})} autoComplete="new-password" required/></label><label>Confirm new password<input type="password" value={pw.confirm_password} onChange={e=>setPw({...pw,confirm_password:e.target.value})} autoComplete="new-password" required/></label><button className="btn primary">Update password</button></form><section className="card profile-info-card"><div className="card-head"><h2>Wallet overview</h2></div><div className="profile-wallet-inline"><div><span>Total balance</span><b>{money(user.balance)}</b></div><div><span>Deposit credit</span><b>{money(user.balance-user.withdrawable)}</b><small>Non-withdrawable</small></div><div><span>Earnings credit</span><b className="positive">{money(user.withdrawable)}</b><small>Withdrawable</small></div><div><span>Referral code</span><b style={{fontSize:'1.05rem'}}>{user.referral_code}</b><small>3-level commission</small></div></div></section></div>}{tab==='activity'&&<section className="card"><div className="card-head"><h2>Account activity</h2></div><TransactionList items={transactions}/></section>}{tab==='preferences'&&<div className="content-grid"><form className="card settings-card" onSubmit={save}><div className="card-head"><div><h2>Notification preferences</h2><p>Choose which account messages you receive.</p></div></div><label className="switch-row"><div><b>Transaction notifications</b><span>Deposits, withdrawals and earnings</span></div><input type="checkbox" checked={form.notify_transactions} onChange={e=>setForm({...form,notify_transactions:e.target.checked})}/></label><label className="switch-row"><div><b>Platform announcements</b><span>Packages, tasks and service updates</span></div><input type="checkbox" checked={form.notify_marketing} onChange={e=>setForm({...form,notify_marketing:e.target.checked})}/></label><div className="form-actions"><button className="btn primary">Save preferences</button></div></form><section className="card profile-info-card"><div className="card-head"><h2>Account details</h2></div><div className="profile-wallet-inline"><div><span>Member since</span><b>{new Date(user.created_at).toLocaleDateString('en-GH',{year:'numeric',month:'long',day:'numeric'})}</b></div><div><span>Phone</span><b>{user.phone}</b></div><div><span>Role</span><b>{user.is_admin?'Administrator':'Member'}</b></div><div><span>Email</span><b>{user.email||'Not set'}</b></div></div></section></div>}</>}

function Admin({onPush}:{onPush:()=>void}){const loc=useLocation(),nav=useNavigate(),[overview,setOverview]=useState<any>(null),[menuOpen,setMenuOpen]=useState(false),[tick,setTick]=useState(0),[manual,setManual]=useState(0);const requested=loc.pathname.split('/')[2]||'overview',tab=ADMIN_NAV.some(x=>x[0]===requested)?requested:'overview',current=ADMIN_NAV.find(x=>x[0]===tab)!;function selectTab(section:string){setMenuOpen(false);nav(`/admin/${section}`)}useEffect(()=>{api('/api/admin/overview').then(setOverview)},[tick,manual]);useEffect(()=>{const timer=window.setInterval(()=>setTick(v=>v+1),20000);return()=>window.clearInterval(timer)},[]);const auto=['overview','deposits','withdrawals','logs','ads'].includes(tab),panelKey=tab+'-'+manual+(auto?'-'+tick:'');return <div className="admin-page"><PageHead eyebrow="ADMINISTRATION" title="Operations console" sub="Manage payments, members, plans and platform content." action={<div className="admin-actions"><button className="btn secondary" onClick={()=>setManual(v=>v+1)}><AppIcon name="refresh" size={17}/> Refresh</button><button className="btn secondary admin-alert-btn" onClick={onPush}><AppIcon name="notifications" size={17}/> Alerts</button></div>}/><div className="admin-commandbar"><button className="admin-menu-trigger" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen}><span><AppIcon name="admin" size={21}/></span><div><small>Admin menu</small><b>{current[2]}</b></div><AppIcon name="chevron" size={17}/></button>{menuOpen&&<><button className="admin-menu-scrim" aria-label="Close admin menu" onClick={()=>setMenuOpen(false)}/><div className="admin-feature-menu">{ADMIN_NAV.map(([section,ic,label])=><button key={section} className={tab===section?'active':''} onClick={()=>selectTab(section)}><span><AppIcon name={ic} size={19}/></span><div><b>{label}</b><small>{section==='overview'?'Key platform totals':section==='deposits'||section==='withdrawals'?'Review payment requests':section==='users'?'Manage member accounts':section==='settings'?'Platform configuration':'Open management tools'}</small></div></button>)}</div></>}</div><div className="admin-tabs">{ADMIN_NAV.map(([section,,label])=><button className={tab===section?'active':''} onClick={()=>selectTab(section)} key={section}>{label}</button>)}</div><section className="admin-panel" key={panelKey}>{tab==='overview'&&(overview?<div className="admin-metrics">{[['users','Members','referrals','users'],['pending_deposits','Pending deposits','deposit','deposits'],['pending_withdrawals','Pending withdrawals','withdraw','withdrawals'],['active_investments','Active plans','packages','packages'],['total_deposited','Total deposited','wallet','deposits'],['total_withdrawn','Total withdrawn','withdraw','withdrawals'],['questions','Questions','quiz','questions'],['tasks','Active tasks','tasks','tasks']].map(([key,label,ic,to])=><article key={key} className="admin-metric-card" role="button" tabIndex={0} title={`Open ${label}`} onClick={()=>selectTab(to)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectTab(to)}}}><span className="admin-metric-icon"><AppIcon name={ic} size={19}/></span><div><span>{label}</span><b>{key.startsWith('total_')?money(Number(overview[key]||0)):String(overview[key]??0)}</b></div><AppIcon name="chevron" size={15}/></article>)}</div>:<PageLoading/>)}{tab==='deposits'&&<ReviewTable type="deposits"/>}{tab==='withdrawals'&&<ReviewTable type="withdrawals"/>}{tab==='packages'&&<AdminPackages/>}{tab==='questions'&&<AdminQuestions/>}{tab==='tasks'&&<AdminTasks/>}{tab==='ads'&&<AdminAds/>}{tab==='broadcasts'&&<AdminBroadcasts/>}{tab==='users'&&<AdminUsers/>}{tab==='logs'&&<AdminLogs/>}{tab==='settings'&&<AdminSettings/>}</section></div>}

function ReviewTable({type}:{type:'deposits'|'withdrawals'}){const[rows,setRows]=useState<any[]|null>(null),[message,setMessage]=useState('');async function load(){setRows(await api(`/api/admin/${type}`))}useEffect(()=>{load()},[type]);async function review(id:number,action:string){await api(`/api/admin/${type}/${id}/review`,{body:{action,note:''}});setMessage(`Request ${action}d.`);load()}if(!rows)return <PageLoading/>;return <section className="card">{message&&<Alert kind="success">{message}</Alert>}<div className="table-wrap"><table><thead><tr><th>Member</th><th>Amount</th><th>Payment details</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.user_name}</b><small>{x.user_phone}</small></td><td>{money(x.amount)}{'net_amount'in x&&<small>Net {money(x.net_amount)}</small>}</td><td>{x.network}<small>{x.momo_number} · {x.momo_name}</small></td><td><Status v={x.status}/></td><td>{dt(x.created_at)}</td><td>{x.status==='pending'?<div className="row-actions"><button onClick={()=>review(x.id,'approve')}>Approve</button><button className="reject" onClick={()=>review(x.id,'reject')}>Reject</button></div>:type==='withdrawals'&&x.status==='approved'?<button onClick={()=>review(x.id,'complete')}>Mark paid</button>:'—'}</td></tr>)}</tbody></table></div></section>}
function AdminPackages(){const[rows,setRows]=useState<Package[]|null>(null),[open,setOpen]=useState(false),[editing,setEditing]=useState<Package|null>(null),[form,setForm]=useState<any>({name:'',description:'',image_url:'',min_amount:100,max_amount:100,daily_income:5,duration_days:30,status:'active',featured:false});async function load(){setRows(await api('/api/admin/packages'))}useEffect(()=>{load()},[]);function edit(x?:Package){setEditing(x||null);setForm(x||{name:'',description:'',image_url:'',min_amount:100,max_amount:100,daily_income:5,duration_days:30,status:'active',featured:false});setOpen(true)}async function save(e:React.FormEvent){e.preventDefault();await api(editing?`/api/admin/packages/${editing.id}`:'/api/admin/packages',{method:editing?'PATCH':'POST',body:{...form,max_amount:form.min_amount}});setOpen(false);load()}async function remove(id:number){if(confirm('Delete this package?')){await api(`/api/admin/packages/${id}`,{method:'DELETE'});load()}}if(!rows)return <PageLoading/>;return <><section className="card"><div className="card-head"><h2>Package catalog</h2><button className="btn primary" onClick={()=>edit()}>Add package</button></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Price</th><th>Daily</th><th>Duration</th><th>Status</th><th/></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{money(x.min_amount)}</td><td>{money(x.daily_income)}</td><td>{x.duration_days} days</td><td><Status v={x.status}/></td><td className="row-actions"><button onClick={()=>edit(x)}>Edit</button><button className="reject" onClick={()=>remove(x.id)}>Delete</button></td></tr>)}</tbody></table></div></section>{open&&<div className="modal-backdrop"><form className="modal wide-modal" onSubmit={save}><button type="button" className="modal-close" onClick={()=>setOpen(false)}>×</button><h2>{editing?'Edit package':'New package'}</h2><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><ImageUpload label="Package image" value={form.image_url||''} onChange={u=>setForm({...form,image_url:u})}/><div className="field-grid"><label>Price (GHS)<input type="number" value={form.min_amount} onChange={e=>setForm({...form,min_amount:Number(e.target.value),max_amount:Number(e.target.value)})}/></label><label>Daily income (GHS)<input type="number" value={form.daily_income} onChange={e=>setForm({...form,daily_income:Number(e.target.value)})}/></label><label>Duration (days)<input type="number" value={form.duration_days} onChange={e=>setForm({...form,duration_days:Number(e.target.value)})}/></label></div><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>active</option><option>locked</option><option>hidden</option></select></label><button className="btn primary wide">Save package</button></form></div>}</>}
function AdminQuestions(){const[rows,setRows]=useState<any[]|null>(null),[open,setOpen]=useState(false),[editing,setEditing]=useState<any>(null),[form,setForm]=useState<any>({category:'Financial literacy',text:'',option_a:'',option_b:'',option_c:'',option_d:'',correct_option:'A',explanation:'',active:true});async function load(){setRows(await api('/api/admin/questions?limit=100'))}useEffect(()=>{load()},[]);function edit(x?:any){setEditing(x||null);setForm(x||{category:'Financial literacy',text:'',option_a:'',option_b:'',option_c:'',option_d:'',correct_option:'A',explanation:'',active:true});setOpen(true)}async function save(e:React.FormEvent){e.preventDefault();await api(editing?`/api/admin/questions/${editing.id}`:'/api/admin/questions',{method:editing?'PATCH':'POST',body:form});setOpen(false);load()}async function remove(id:number){if(confirm('Delete this question?')){await api(`/api/admin/questions/${id}`,{method:'DELETE'});load()}}if(!rows)return <PageLoading/>;return <><section className="card"><div className="card-head"><div><h2>Question bank</h2><p>520 seeded questions · displaying latest 100</p></div><button className="btn primary" onClick={()=>edit()}>Add question</button></div><div className="question-admin-list">{rows.map(x=><div key={x.id}><span>{x.category}</span><p><b>{x.text}</b><small>Answer {x.correct_option} · {x.explanation}</small></p><div><button onClick={()=>edit(x)}>Edit</button><button onClick={()=>remove(x.id)}>Delete</button></div></div>)}</div></section>{open&&<div className="modal-backdrop"><form className="modal wide-modal" onSubmit={save}><button type="button" className="modal-close" onClick={()=>setOpen(false)}>×</button><h2>{editing?'Edit question':'New question'}</h2><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Question<textarea value={form.text} onChange={e=>setForm({...form,text:e.target.value})} required/></label>{['a','b','c','d'].map(x=><label key={x}>Option {x.toUpperCase()}<input value={form[`option_${x}`]} onChange={e=>setForm({...form,[`option_${x}`]:e.target.value})} required/></label>)}<label>Correct answer<select value={form.correct_option} onChange={e=>setForm({...form,correct_option:e.target.value})}>{['A','B','C','D'].map(x=><option key={x}>{x}</option>)}</select></label><label>Explanation<textarea value={form.explanation} onChange={e=>setForm({...form,explanation:e.target.value})} required/></label><button className="btn primary wide">Save question</button></form></div>}</>}
function AdminUsers(){const[rows,setRows]=useState<any[]|null>(null),[q,setQ]=useState(''),[editing,setEditing]=useState<any>(null),[form,setForm]=useState<any>(null),[adjust,setAdjust]=useState<any>(null),[reset,setReset]=useState<any>(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');async function load(){setRows(await api<any[]>('/api/admin/users'))}useEffect(()=>{load()},[]);async function toggle(id:number){await api(`/api/admin/users/${id}/toggle`,{method:'POST'});load()}async function remove(id:number){if(confirm('Delete this account permanently? Their phone number will be blocked and cannot be used to register again.')){await api(`/api/admin/users/${id}`,{method:'DELETE'});setEditing(null);load()}}function openEdit(x:any){setMsg('');setEditing(x);setForm({full_name:x.full_name,phone:x.phone,email:x.email||'',telegram:x.telegram||'',is_active:x.active,is_admin:x.is_admin});setAdjust(null);setReset(null)}async function saveEdit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg('');try{await api(`/api/admin/users/${editing.id}`,{method:'PATCH',body:form});setMsg('Member details saved.');load();const refreshed=(await api<any[]>('/api/admin/users')).find((u:any)=>u.id===editing.id);if(refreshed){setEditing(refreshed);setForm({full_name:refreshed.full_name,phone:refreshed.phone,email:refreshed.email||'',telegram:refreshed.telegram||'',is_active:refreshed.active,is_admin:refreshed.is_admin})}}catch(err:any){setMsg(err?.message||'Could not save member')}finally{setBusy(false)}}async function saveAdjust(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg('');try{await api(`/api/admin/users/${adjust.id}/adjust`,{body:{wallet:adjust.wallet,amount:Number(adjust.amount),reason:adjust.reason||'Admin adjustment'}});setAdjust(null);setMsg('Balance adjusted.');load()}catch(err:any){setMsg(err?.message||'Could not adjust balance')}finally{setBusy(false)}}async function saveReset(e:React.FormEvent){e.preventDefault();if(reset.password.length<6){setMsg('Password must be at least 6 characters');return}setBusy(true);setMsg('');try{await api(`/api/admin/users/${reset.id}/reset-password`,{body:{new_password:reset.password}});setReset(null);setMsg('Password reset successfully. Share the new password with the member.')}catch(err:any){setMsg(err?.message||'Could not reset password')}finally{setBusy(false)}}if(!rows)return <PageLoading/>;const filtered=rows.filter(x=>(x.full_name+' '+x.phone).toLowerCase().includes(q.toLowerCase()));return <section className="card"><div className="card-head"><div><h2>Members</h2><p>{rows.length} registered</p></div><input className="admin-search" placeholder="Search name or phone" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="table-wrap"><table><thead><tr><th>Member</th><th>Phone</th><th>Balance</th><th>Earnings</th><th>Status</th><th>Joined</th><th>Controls</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.full_name}</b>{x.is_admin?<small>Administrator</small>:null}</td><td>{x.phone}</td><td>{money(x.balance)}</td><td>{money(x.earnings)}</td><td><Status v={x.active?'active':'disabled'}/></td><td>{dt(x.created_at)}</td><td className="row-actions"><button onClick={()=>openEdit(x)}>Manage</button></td></tr>)}</tbody></table></div>{editing&&<div className="modal-backdrop member-sheet-backdrop" onClick={()=>{setEditing(null);setAdjust(null);setReset(null)}}><div className="modal member-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Manage member"><button type="button" className="modal-close" onClick={()=>{setEditing(null);setAdjust(null);setReset(null)}}>×</button><div className="member-sheet-scroll"><header className="member-sheet-head"><span className="avatar xl">{initials(editing.full_name)}</span><div><span className="eyebrow">MEMBER MANAGEMENT</span><h2>{editing.full_name}</h2><p>{editing.phone} · Joined {dt(editing.created_at)}</p><Status v={editing.active?'active':'disabled'}/></div></header>{msg&&<Alert kind={/saved|success|reset|adjusted/i.test(msg)?'success':'error'}>{msg}</Alert>}<div className="member-stats"><article><span>Total balance</span><b>{money(editing.balance)}</b></article><article><span>Earnings</span><b>{money(editing.earnings)}</b></article><article><span>Role</span><b>{editing.is_admin?'Admin':'Member'}</b></article></div><form className="member-edit-form" onSubmit={saveEdit}><h3>Profile details</h3><label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label><label>Email<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Telegram<input value={form.telegram} onChange={e=>setForm({...form,telegram:e.target.value})}/></label><div className="switch-row"><div><b>Active</b><span>Allow this member to sign in</span></div><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/></div><div className="switch-row"><div><b>Administrator</b><span>Grant admin console access</span></div><input type="checkbox" checked={form.is_admin} onChange={e=>setForm({...form,is_admin:e.target.checked})}/></div><button className="btn primary wide" disabled={busy}>{busy?'Saving...':'Save member details'}</button></form><div className="member-actions-block"><h3>Quick actions</h3><div className="member-action-grid"><button type="button" className="btn secondary" onClick={()=>setAdjust({id:editing.id,wallet:'earnings',amount:'',reason:''})}>Adjust balance</button><button type="button" className="btn secondary" onClick={()=>setReset({id:editing.id,name:editing.full_name,password:''})}>Reset password</button>{!editing.is_admin&&<button type="button" className="btn secondary" onClick={()=>toggle(editing.id)}>{editing.active?'Disable account':'Enable account'}</button>}{!editing.is_admin&&<button type="button" className="btn danger" onClick={()=>remove(editing.id)}>Delete member</button>}</div></div>{adjust&&adjust.id===editing.id&&<form className="member-subform" onSubmit={saveAdjust}><h3>Adjust balance</h3><p className="muted">Credit or debit this member’s wallet manually.</p><label>Wallet<select value={adjust.wallet} onChange={e=>setAdjust({...adjust,wallet:e.target.value})}><option value="earnings">Earnings credit (withdrawable)</option><option value="deposit">Deposit credit</option></select></label><label>Amount (negative to deduct)<input type="number" step="0.01" value={adjust.amount} onChange={e=>setAdjust({...adjust,amount:e.target.value})} required/></label><label>Reason<input value={adjust.reason} onChange={e=>setAdjust({...adjust,reason:e.target.value})} placeholder="e.g. Manual correction"/></label><div className="form-actions"><button type="button" className="btn secondary" onClick={()=>setAdjust(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy?'Applying...':'Apply adjustment'}</button></div></form>}{reset&&reset.id===editing.id&&<form className="member-subform" onSubmit={saveReset}><h3>Reset password</h3><p className="muted">Set a new password for <b>{reset.name}</b>.</p><label>New password<input type="password" value={reset.password} onChange={e=>setReset({...reset,password:e.target.value})} placeholder="At least 6 characters" required/></label><div className="form-actions"><button type="button" className="btn secondary" onClick={()=>setReset(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy?'Saving...':'Set new password'}</button></div></form>}</div></div></div>}</section>}
function AdminSettings(){const[form,setForm]=useState<any>(null),[message,setMessage]=useState('');useEffect(()=>{api('/api/admin/settings').then(setForm)},[]);if(!form)return <PageLoading/>;async function save(e:React.FormEvent){e.preventDefault();await api('/api/admin/settings',{method:'PUT',body:{values:form}});setMessage('Settings published live.')}return <form className="card form-card settings-form" onSubmit={save}>{message&&<Alert kind="success">{message}</Alert>}<div className="card-head"><div><h2>Platform settings</h2><p>Changes publish immediately across the live platform.</p></div></div><div className="field-grid">{Object.entries(form).map(([k,v])=><label key={k}>{k.replaceAll('_',' ')}<input value={String(v)} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="btn primary">Publish settings</button></form>}

function AdminTasks(){const[rows,setRows]=useState<any[]|null>(null),[open,setOpen]=useState(false),[editing,setEditing]=useState<any>(null),[form,setForm]=useState<any>({title:'',description:'',category:'General',reward:1,external_link:'',timer_seconds:0,daily_limit:1,active:true});async function load(){setRows(await api('/api/admin/tasks'))}useEffect(()=>{load()},[]);function edit(x?:any){setEditing(x||null);setForm(x||{title:'',description:'',category:'General',reward:1,external_link:'',timer_seconds:0,daily_limit:1,active:true});setOpen(true)}async function save(e:React.FormEvent){e.preventDefault();await api(editing?`/api/admin/tasks/${editing.id}`:'/api/admin/tasks',{method:editing?'PATCH':'POST',body:form});setOpen(false);load()}async function remove(id:number){await api(`/api/admin/tasks/${id}`,{method:'DELETE'});load()}if(!rows)return <PageLoading/>;return <><section className="card"><div className="card-head"><div><h2>Task inventory</h2><p>Optional member activities and verified rewards.</p></div><button className="btn primary" onClick={()=>edit()}>Add task</button></div><div className="table-wrap"><table><thead><tr><th>Task</th><th>Category</th><th>Reward</th><th>Limit</th><th>Status</th><th/></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.title}</b></td><td>{x.category}</td><td>{money(x.reward)}</td><td>{x.daily_limit}/day</td><td><Status v={x.available?'active':'disabled'}/></td><td className="row-actions"><button onClick={()=>edit(x)}>Edit</button><button className="reject" onClick={()=>remove(x.id)}>Archive</button></td></tr>)}</tbody></table></div></section>{open&&<div className="modal-backdrop"><form className="modal wide-modal" onSubmit={save}><button type="button" className="modal-close" onClick={()=>setOpen(false)}>×</button><h2>{editing?'Edit task':'New task'}</h2><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="field-grid"><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label><label>Reward<input type="number" step=".01" value={form.reward} onChange={e=>setForm({...form,reward:Number(e.target.value)})}/></label><label>Timer seconds<input type="number" value={form.timer_seconds} onChange={e=>setForm({...form,timer_seconds:Number(e.target.value)})}/></label><label>Daily limit<input type="number" value={form.daily_limit} onChange={e=>setForm({...form,daily_limit:Number(e.target.value)})}/></label></div><label>External link<input value={form.external_link} onChange={e=>setForm({...form,external_link:e.target.value})}/></label><button className="btn primary wide">Save task</button></form></div>}</>}
function AdminAds(){const[rows,setRows]=useState<any[]|null>(null);async function load(){setRows(await api('/api/admin/ads'))}useEffect(()=>{load()},[]);async function review(id:number,action:string){await api(`/api/admin/ads/${id}/review`,{body:{action,note:''}});load()}if(!rows)return <PageLoading/>;return <section className="card"><div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Owner</th><th>Price</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.title}</b></td><td>{x.owner_phone}</td><td>{money(x.price)}</td><td><Status v={x.status}/></td><td>{dt(x.created_at)}</td><td>{x.status==='pending'&&<div className="row-actions"><button onClick={()=>review(x.id,'approve')}>Approve</button><button className="reject" onClick={()=>review(x.id,'reject')}>Reject</button></div>}</td></tr>)}</tbody></table></div></section>}
function AdminBroadcasts(){const[rows,setRows]=useState<any[]|null>(null),[form,setForm]=useState({type:'dashboard',title:'',message:'',image_url:'',target:'all',user_id:null as number|null});async function load(){setRows(await api('/api/admin/notifications'))}useEffect(()=>{load()},[]);async function send(e:React.FormEvent){e.preventDefault();await api('/api/admin/notifications',{body:form});setForm({...form,title:'',message:'',image_url:''});load()}async function remove(id:number){if(!confirm('Remove this broadcast for everyone? This also removes any uploaded image.'))return;await api(`/api/admin/notifications/${id}`,{method:'DELETE'});load()}if(!rows)return <PageLoading/>;return <div className="content-grid"><form className="card form-card" onSubmit={send}><div className="card-head"><div><h2>Publish notification</h2><p>Popups, banners, dashboard alerts or uncropped image notices.</p></div></div><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>dashboard</option><option>banner</option><option>popup</option><option>image</option></select></label><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></label><label>Message<textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label><ImageUpload label="Notice image" value={form.image_url} onChange={u=>setForm({...form,image_url:u})}/><button className="btn primary wide">Publish now</button></form><section className="card"><div className="card-head"><h2>Published notices</h2></div><div className="request-list">{rows.map(x=><div key={x.id}><p><b>{x.title}</b><small>{x.type} · {dt(x.created_at)}</small></p><button className="reject" onClick={()=>remove(x.id)}>Remove</button></div>)}</div></section></div>}
function AdminLogs(){const[rows,setRows]=useState<any[]|null>(null);useEffect(()=>{api<any[]>('/api/admin/logs').then(setRows)},[]);if(!rows)return <PageLoading/>;return <section className="card"><div className="table-wrap"><table><thead><tr><th>Action</th><th>Target</th><th>Detail</th><th>Timestamp</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.action}</b></td><td>{x.target}</td><td>{x.detail}</td><td>{dt(x.created_at)}</td></tr>)}</tbody></table></div></section>}


export {LandingPage,Dashboard,Packages,DepositStart,DepositPay as DepositPayment,Withdraw as Withdrawal,Tasks,DailyQuestions as Questions,Profile,Referrals,Marketplace as Advertisements,Notifications,Admin,AuthPage,SkeletonPage,SkeletonCard}
export default function App(){const{user,loading}=useAuth();if(loading)return <div className="boot"><Logo/><Spinner/></div>;return user?<Shell/>:<Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={<AuthPage initialMode="login"/>}/><Route path="/signup" element={<AuthPage initialMode="register"/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
