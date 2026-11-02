'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {decodeState,initialState,STORAGE_KEY,type LearningState} from './storage';
type Store={state:LearningState;update:(change:(s:LearningState)=>LearningState)=>boolean;ready:boolean};
const Context=createContext<Store|null>(null);
export function LearningProvider({children}:{children:ReactNode}){
 const [state,setState]=useState(initialState),[ready,setReady]=useState(false),[error,setError]=useState(''),[corrupt,setCorrupt]=useState(false);const current=useRef(state);const invalid=useRef(false);
 useEffect(()=>{try{const s=decodeState(localStorage.getItem(STORAGE_KEY));current.current=s;setState(s)}catch{invalid.current=true;setCorrupt(true);setError('Saved data is unreadable or storage is unavailable. Your new work stays in this tab; the existing data has not been overwritten.')}setReady(true)},[]);
 function update(change:(s:LearningState)=>LearningState){const next=change(current.current);current.current=next;setState(next);if(invalid.current)return false;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setError('');return true}catch{setError('Could not save on this device. Your text is still here. Keep this tab open and try saving again.');return false}}
 function recover(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)localStorage.setItem(STORAGE_KEY+'-recovery-'+Date.now(),raw);localStorage.setItem(STORAGE_KEY,JSON.stringify(current.current));invalid.current=false;setCorrupt(false);setError('')}catch{setError('Storage is still unavailable. Your work remains in this tab.')}}
 return <Context.Provider value={{state,update,ready}}>{error&&<aside role="alert" className="learning-storage-error">{error}{corrupt&&<button onClick={recover}>Back up old data & start fresh</button>}</aside>}{ready?children:<p role="status" className="learn-loading">Opening your learning space…</p>}</Context.Provider>;
}
export function useLearning(){const c=useContext(Context);if(!c)throw Error('LearningProvider is required');return c}
