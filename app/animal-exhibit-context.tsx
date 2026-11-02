'use client';
import {createContext,useContext} from 'react';
export type ExhibitContextValue={isOpen:boolean;open:(slug:string,trigger?:HTMLElement|null)=>void};
export const AnimalExhibitContext=createContext<ExhibitContextValue>({isOpen:false,open:()=>{}});
export const useAnimalExhibit=()=>useContext(AnimalExhibitContext);
