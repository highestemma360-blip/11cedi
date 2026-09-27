import {createContext,useContext,useEffect,useState} from 'react';
import type{ReactNode}from'react';
import{api,setToken}from'./api';
import type{User}from'./types';

type Reg={full_name:string;phone:string;password:string;confirm_password:string;captcha_token:string;captcha_answer:string;referral_code?:string};
type Ctx={user:User|null;loading:boolean;login:(p:string,w:string)=>Promise<void>;register:(p:Reg)=>Promise<void>;logout:()=>void;refresh:()=>Promise<void>;setUser:(u:User)=>void};
const C=createContext<Ctx>(null as unknown as Ctx);

function normalizePhone(raw:string){
  const s=(raw||'').trim();
  return s.replace(/[^\d+]/g,'').replace(/(?!^)\+/g,'');
}

export function AuthProvider({children}:{children:ReactNode}){
  const[user,setUser]=useState<User|null>(null);
  const[loading,setLoading]=useState(true);
  async function refresh(){
    try{setUser(await api<User>('/api/users/me'))}
    catch{setUser(null)}
  }
  useEffect(()=>{
    const expired=()=>{setToken(null);setUser(null)};
    window.addEventListener('cedigain:auth-expired',expired);
    (async()=>{
      if(localStorage.getItem('cedigain_token'))await refresh();
      setLoading(false);
    })();
    return()=>window.removeEventListener('cedigain:auth-expired',expired);
  },[]);
  async function login(phone:string,password:string){
    const normalized=normalizePhone(phone);
    if(normalized.length<7)throw new Error('Enter a valid phone number');
    const f=new URLSearchParams({username:normalized,password});
    const x=await api<{access_token:string}>('/api/auth/login',{method:'POST',form:f});
    setToken(x.access_token);
    await refresh();
  }
  async function register(p:Reg){
    const body={...p,phone:normalizePhone(p.phone),full_name:(p.full_name||'').trim()};
    if(body.phone.length<7)throw new Error('Enter a valid phone number');
    if(body.password!==body.confirm_password)throw new Error('Passwords do not match');
    if(body.password.length<6)throw new Error('Password must be at least 6 characters');
    const x=await api<{access_token:string}>('/api/auth/register',{body});
    setToken(x.access_token);
    await refresh();
  }
  function logout(){setToken(null);setUser(null)}
  return <C.Provider value={{user,loading,login,register,logout,refresh,setUser}}>{children}</C.Provider>;
}
export const useAuth=()=>useContext(C);
