'use client';
import {Component,type ReactNode} from 'react';
export default class PlantBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(this.state.failed)return <section id="main" className="page-content" role="alert"><h1>Plant lab couldn’t load</h1><p>The rest of the atlas is still available. Try opening the lab again.</p><button className="action-button" onClick={()=>this.setState({failed:false})}>Try Plant lab again</button> <a className="action-button" href="/">Back to the globe</a></section>;
  return this.props.children;
 }
}
